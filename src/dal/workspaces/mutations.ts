import { db } from "@/drizzle/db"
import {
  WorkspaceInsertData,
  WorkspaceTable,
  WorkspaceMemberInsertData,
  WorkspaceMemberTable,
} from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

export async function createWorkspace(data: WorkspaceInsertData) {
  const [workspace] = await db
    .insert(WorkspaceTable)
    .values(data)
    .returning()

  return workspace
}

export async function updateWorkspace(
  workspaceId: string,
  data: Partial<WorkspaceInsertData>,
) {
  const [workspace] = await db
    .update(WorkspaceTable)
    .set(data)
    .where(eq(WorkspaceTable.id, workspaceId))
    .returning()
    
  return workspace
}

export async function addWorkspaceMember(data: WorkspaceMemberInsertData) {
  const [member] = await db
    .insert(WorkspaceMemberTable)
    .values(data)
    .returning()

  return member
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberInsertData["role"],
) {
  const [member] = await db
    .update(WorkspaceMemberTable)
    .set({ role })
    .where(
      and(
        eq(WorkspaceMemberTable.workspaceId, workspaceId),
        eq(WorkspaceMemberTable.userId, userId),
      ),
    )
    .returning()

  return member
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
) {
  await db
    .delete(WorkspaceMemberTable)
    .where(
      and(
        eq(WorkspaceMemberTable.workspaceId, workspaceId),
        eq(WorkspaceMemberTable.userId, userId),
      ),
    )
}
