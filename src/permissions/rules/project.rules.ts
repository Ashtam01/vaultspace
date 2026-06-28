import type { AbilityBuilder, MongoAbility } from "@casl/ability"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"
import type { Project } from "@/drizzle/schema/project"
import { hasMinWorkspaceRole } from "../roles"

type ProjectSubject =
  | "project"
  | Pick<Project, "department" | "teamId" | "visibility">

type ProjectAbility = MongoAbility<
  [("create" | "read" | "update" | "delete"), ProjectSubject]
>

type AllowFunction = AbilityBuilder<ProjectAbility>["can"]
type ForbidFunction = AbilityBuilder<ProjectAbility>["cannot"]

type ProjectRuleContext = {
  workspaceRole: WorkspaceRole
  teamRole: TeamRole | null
  userTeamIds: string[]
}

/**
 * Project-level permissions.
 *
 * Combines RBAC (workspace role) with ReBAC (team membership):
 * - Guests: can only view workspace-visible projects
 * - Members: can view workspace-visible + their team's projects
 * - Admins: full CRUD
 * - Owners: full CRUD
 */
export function addProjectRules(
  allow: AllowFunction,
  forbid: ForbidFunction,
  context: ProjectRuleContext,
) {
  const { workspaceRole, userTeamIds } = context

  // ─── Guest rules ────────────────────────────────────────────
  if (workspaceRole === "guest") {
    // Guests can only view public-visibility projects
    allow("read", "project", { visibility: "public" })
    allow("read", "project", { visibility: "workspace" })
    return
  }

  // ─── Member rules ─────────────────────────────────────────
  // Members can view workspace-visible and public projects
  allow("read", "project", { visibility: "workspace" })
  allow("read", "project", { visibility: "public" })

  // Members can view team-visibility projects for their own teams
  userTeamIds.forEach((teamId) => {
    allow("read", "project", { teamId, visibility: "team" })
  })

  // Members can create projects
  if (hasMinWorkspaceRole(workspaceRole, "member")) {
    allow("create", "project")
  }

  // ─── Admin rules ──────────────────────────────────────────
  if (hasMinWorkspaceRole(workspaceRole, "admin")) {
    allow("read", "project")
    allow("update", "project")
    allow("delete", "project")
  }

  // ─── Owner rules ──────────────────────────────────────────
  if (workspaceRole === "owner") {
    allow("create", "project")
    allow("read", "project")
    allow("update", "project")
    allow("delete", "project")
  }
}
