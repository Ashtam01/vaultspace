import {
  Document,
  Project,
  Team,
  Workspace,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/lib/session"
import { and, eq, isNull, or, SQL } from "drizzle-orm"
import { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core"
import { cache } from "react"
import { AbilityBuilder, createMongoAbility, MongoAbility } from "@casl/ability"
import { permittedFieldsOf, rulesToAST } from "@casl/ability/extra"
import { CompoundCondition, Condition, FieldCondition } from "@ucast/core"

import { db } from "@/drizzle/db"
import { WorkspaceMemberTable, TeamMemberTable } from "@/drizzle/schema"
import { getUserTeamProjectIds } from "./rebac"
import { addWorkspaceRules } from "./rules/workspace.rules"
import { addDocumentRules } from "./rules/document.rules"
import { addProjectRules } from "./rules/project.rules"
import { addTeamRules } from "./rules/team.rules"

export const getUserWorkspacePermissions = cache(getUserWorkspacePermissionsInternal)

type WorkspaceSubject = "workspace" | Workspace
type TeamSubject = "team" | Team
type ProjectSubject = "project" | Pick<Project, "department" | "teamId" | "visibility">
type DocumentSubject =
  | "document"
  | Pick<Document, "projectId" | "creatorId" | "status" | "isLocked" | "sensitivity">

export type AppAbility = MongoAbility<
  | [
      | "manage_settings"
      | "invite_users"
      | "create_teams"
      | "create_projects"
      | "view_members"
      | "delete",
      WorkspaceSubject,
    ]
  | ["create" | "read" | "update" | "delete" | "manage_members", TeamSubject]
  | ["create" | "read" | "update" | "delete", ProjectSubject]
  | ["create" | "read" | "update" | "delete", DocumentSubject]
>

async function getUserWorkspacePermissionsInternal(workspaceId: string) {
  const user = await getCurrentUser()
  const { build, can, cannot } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (user == null) {
    return build()
  }

  // 1. Get workspace membership
  const workspaceMember = await db.query.WorkspaceMemberTable.findFirst({
    where: and(
      eq(WorkspaceMemberTable.workspaceId, workspaceId),
      eq(WorkspaceMemberTable.userId, user.id),
    ),
  })

  // If not in workspace, return empty ability (no permissions)
  if (!workspaceMember) {
    return build()
  }

  const workspaceRole = workspaceMember.role

  // 2. Get team memberships for this workspace
  const teamMemberships = await db.query.TeamMemberTable.findMany({
    where: eq(TeamMemberTable.userId, user.id),
    with: {
      team: true,
    },
  })

  // Filter teams that belong to this workspace
  const workspaceTeams = teamMemberships.filter(
    (tm) => tm.team.workspaceId === workspaceId,
  )
  
  // For simplicity in the rule definition, if they are lead in ANY team, we pass "lead"
  // A fully robust ReBAC might build rules per-team, but this suffices for the demo.
  const hasLeadRole = workspaceTeams.some((tm) => tm.role === "lead")
  const teamRole = hasLeadRole ? "lead" : workspaceTeams.length > 0 ? "member" : null
  const userTeamIds = workspaceTeams.map((tm) => tm.teamId)
  const teamProjectIds = await getUserTeamProjectIds(user.id, workspaceId)

  // 3. Apply rules
  // @ts-expect-error CASL types are tricky across files, but structurally compatible
  addWorkspaceRules(can, cannot, workspaceRole)
  // @ts-expect-error
  addTeamRules(can, cannot, { workspaceRole, teamRole })
  // @ts-expect-error
  addProjectRules(can, cannot, { workspaceRole, teamRole, userTeamIds })
  // @ts-expect-error
  addDocumentRules(can, cannot, {
    userId: user.id,
    workspaceRole,
    teamRole,
    teamProjectIds,
  })

  return build()
}

export async function pickPermittedFields<T extends Record<string, unknown>>(
  workspaceId: string,
  action: Parameters<typeof permittedFieldsOf<AppAbility>>[1],
  subject: Parameters<typeof permittedFieldsOf<AppAbility>>[2],
  data: T,
) {
  const permissions = await getUserWorkspacePermissions(workspaceId)
  const fields = permittedFieldsOf(permissions, action, subject, {
    fieldsFrom: (rule) => rule.fields ?? Object.keys(data),
  })

  const result: Record<string, unknown> = {}
  for (const field of fields) {
    result[field] = data[field]
  }

  return result as Partial<T>
}

export async function toDrizzleWhere<T extends TableConfig>(
  workspaceId: string,
  action: Parameters<Awaited<ReturnType<typeof getUserWorkspacePermissions>>["rulesFor"]>[0],
  subject: Parameters<Awaited<ReturnType<typeof getUserWorkspacePermissions>>["rulesFor"]>[1],
  table: PgTableWithColumns<T>,
) {
  const permissions = await getUserWorkspacePermissions(workspaceId)
  const ast = rulesToAST(permissions, action, subject)

  if (ast == null) return undefined

  return getConditionSql(ast, table)
}

function getConditionSql<T extends TableConfig>(
  condition: Condition,
  table: PgTableWithColumns<T>,
): SQL | undefined {
  if (condition instanceof CompoundCondition) {
    switch (condition.operator) {
      case "and":
        return drizzleAnd(condition, table)
      case "or":
        return drizzleOr(condition, table)
    }
  }

  if (condition instanceof FieldCondition) {
    switch (condition.operator) {
      case "eq":
        return drizzleEq(condition, table)
    }
  }
}

function drizzleAnd<T extends TableConfig>(
  condition: CompoundCondition,
  table: PgTableWithColumns<T>,
) {
  return and(...condition.value.map((cond) => getConditionSql(cond, table)))
}

function drizzleOr<T extends TableConfig>(
  condition: CompoundCondition,
  table: PgTableWithColumns<T>,
) {
  return or(...condition.value.map((cond) => getConditionSql(cond, table)))
}

function drizzleEq<T extends TableConfig>(
  condition: FieldCondition,
  table: PgTableWithColumns<T>,
) {
  if (condition.value == null) {
    return isNull(table[condition.field])
  }
  return eq(table[condition.field], condition.value)
}
