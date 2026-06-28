import { db } from "@/drizzle/db"
import { WorkspaceTable, WorkspaceMemberTable } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

export async function getWorkspaceById(id: string) {
  return db.query.WorkspaceTable.findFirst({
    where: eq(WorkspaceTable.id, id),
  })
}

export async function getWorkspaceBySlug(slug: string) {
  return db.query.WorkspaceTable.findFirst({
    where: eq(WorkspaceTable.slug, slug),
  })
}

export async function getUserWorkspaces(userId: string) {
  return db
    .select({
      workspace: WorkspaceTable,
      role: WorkspaceMemberTable.role,
    })
    .from(WorkspaceMemberTable)
    .innerJoin(WorkspaceTable, eq(WorkspaceMemberTable.workspaceId, WorkspaceTable.id))
    .where(eq(WorkspaceMemberTable.userId, userId))
}

export async function getWorkspaceMembers(workspaceId: string) {
  return db.query.WorkspaceMemberTable.findMany({
    where: eq(WorkspaceMemberTable.workspaceId, workspaceId),
    with: {
      user: true,
    },
  })
}
