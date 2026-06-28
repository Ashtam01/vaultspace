import { db } from "@/drizzle/db"
import {
  DocumentTable,
  ProjectTable,
  TeamMemberTable,
  TeamTable,
  WorkspaceMemberTable,
} from "@/drizzle/schema"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"
import { and, eq } from "drizzle-orm"

export type DocumentAccessContext = {
  hasAccess: boolean
  workspaceRole: WorkspaceRole | null
  teamRole: TeamRole | null
  isCreator: boolean
  document: typeof DocumentTable.$inferSelect | null
  projectTeamId: string | null
  workspaceId: string | null
}

export type ProjectAccessContext = {
  hasAccess: boolean
  workspaceRole: WorkspaceRole | null
  teamRole: TeamRole | null
  isOwner: boolean
  project: typeof ProjectTable.$inferSelect | null
  workspaceId: string | null
}

/**
 * Resolves the full relationship chain for document access:
 * User → WorkspaceMember → Team → TeamMember → Project → Document
 *
 * This is the heart of ReBAC — a single optimized query that resolves
 * whether a user can access a document and with what context.
 */
export async function resolveDocumentAccess(
  userId: string,
  documentId: string,
): Promise<DocumentAccessContext> {
  const noAccess: DocumentAccessContext = {
    hasAccess: false,
    workspaceRole: null,
    teamRole: null,
    isCreator: false,
    document: null,
    projectTeamId: null,
    workspaceId: null,
  }

  // Step 1: Get the document and its project (with workspace + team info)
  const document = await db.query.DocumentTable.findFirst({
    where: eq(DocumentTable.id, documentId),
    with: {
      project: true,
    },
  })

  if (!document) return noAccess

  const project = document.project
  if (!project) return noAccess

  // If project has no workspace, it's a legacy project — allow access
  // based on legacy role (backward compatibility)
  if (!project.workspaceId) {
    return {
      hasAccess: true,
      workspaceRole: null,
      teamRole: null,
      isCreator: document.creatorId === userId,
      document,
      projectTeamId: project.teamId,
      workspaceId: null,
    }
  }

  // Step 2: Check workspace membership
  const workspaceMember = await db.query.WorkspaceMemberTable.findFirst({
    where: and(
      eq(WorkspaceMemberTable.workspaceId, project.workspaceId),
      eq(WorkspaceMemberTable.userId, userId),
    ),
  })

  if (!workspaceMember) return noAccess

  // Step 3: Check team membership (if project belongs to a team)
  let teamRole: TeamRole | null = null
  if (project.teamId) {
    const teamMember = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.teamId, project.teamId),
        eq(TeamMemberTable.userId, userId),
      ),
    })
    teamRole = teamMember?.role ?? null
  }

  return {
    hasAccess: true,
    workspaceRole: workspaceMember.role,
    teamRole,
    isCreator: document.creatorId === userId,
    document,
    projectTeamId: project.teamId,
    workspaceId: project.workspaceId,
  }
}

/**
 * Resolves the full relationship chain for project access:
 * User → WorkspaceMember → Team → Project
 */
export async function resolveProjectAccess(
  userId: string,
  projectId: string,
): Promise<ProjectAccessContext> {
  const noAccess: ProjectAccessContext = {
    hasAccess: false,
    workspaceRole: null,
    teamRole: null,
    isOwner: false,
    project: null,
    workspaceId: null,
  }

  const project = await db.query.ProjectTable.findFirst({
    where: eq(ProjectTable.id, projectId),
  })

  if (!project) return noAccess

  // Legacy project without workspace
  if (!project.workspaceId) {
    return {
      hasAccess: true,
      workspaceRole: null,
      teamRole: null,
      isOwner: project.ownerId === userId,
      project,
      workspaceId: null,
    }
  }

  // Check workspace membership
  const workspaceMember = await db.query.WorkspaceMemberTable.findFirst({
    where: and(
      eq(WorkspaceMemberTable.workspaceId, project.workspaceId),
      eq(WorkspaceMemberTable.userId, userId),
    ),
  })

  if (!workspaceMember) return noAccess

  // Check team membership
  let teamRole: TeamRole | null = null
  if (project.teamId) {
    const teamMember = await db.query.TeamMemberTable.findFirst({
      where: and(
        eq(TeamMemberTable.teamId, project.teamId),
        eq(TeamMemberTable.userId, userId),
      ),
    })
    teamRole = teamMember?.role ?? null
  }

  return {
    hasAccess: true,
    workspaceRole: workspaceMember.role,
    teamRole,
    isOwner: project.ownerId === userId,
    project,
    workspaceId: project.workspaceId,
  }
}

/**
 * Get all project IDs for teams the user belongs to within a workspace.
 * Used to scope CASL rules to team-owned projects.
 */
export async function getUserTeamProjectIds(
  userId: string,
  workspaceId: string,
): Promise<string[]> {
  // Find all teams the user is in within this workspace
  const teamMemberships = await db
    .select({ teamId: TeamMemberTable.teamId })
    .from(TeamMemberTable)
    .innerJoin(TeamTable, eq(TeamMemberTable.teamId, TeamTable.id))
    .where(
      and(
        eq(TeamMemberTable.userId, userId),
        eq(TeamTable.workspaceId, workspaceId),
      ),
    )

  if (teamMemberships.length === 0) return []

  const teamIds = teamMemberships.map((tm) => tm.teamId)

  // Find all projects assigned to those teams
  const projects = await db.query.ProjectTable.findMany({
    where: and(
      eq(ProjectTable.workspaceId, workspaceId),
    ),
    columns: { id: true, teamId: true },
  })

  return projects
    .filter((p) => p.teamId && teamIds.includes(p.teamId))
    .map((p) => p.id)
}
