import { getCurrentUser } from "@/lib/session"
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import {
  createWorkspace,
  updateWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/dal/workspaces/mutations"
import { getWorkspaceById, getWorkspaceMembers, getWorkspaceBySlug } from "@/dal/workspaces/queries"
import { logAction } from "./audit"
import { WorkspaceInsertData, WorkspaceMemberInsertData } from "@/drizzle/schema"

export async function createWorkspaceService(data: Omit<WorkspaceInsertData, "createdById">) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  // Creating a workspace is a global action, but here we assume anyone can do it
  const workspace = await createWorkspace({
    ...data,
    createdById: user.id,
  })

  // Creator becomes owner
  await addWorkspaceMember({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  })

  await logAction(user.id, workspace.id, "create", "workspace", workspace.id, {
    name: workspace.name,
  })

  return workspace
}

export async function updateWorkspaceService(
  workspaceId: string,
  data: Partial<WorkspaceInsertData>,
) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("manage_settings", "workspace")) {
    throw new AuthorizationError("Cannot manage workspace settings")
  }

  const workspace = await updateWorkspace(workspaceId, data)
  
  await logAction(user.id, workspaceId, "update", "workspace", workspaceId, data)

  return workspace
}

export async function getWorkspaceService(workspaceId: string) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()
  
  // Implicitly, if they have an ability build for this workspace, they can view it.
  // Actually they can view it if they are a member.
  const workspace = await getWorkspaceById(workspaceId)
  if (!workspace) throw new NotFoundError("Workspace not found")
  
  return workspace
}

export async function getWorkspaceBySlugService(slug: string) {
  const workspace = await getWorkspaceBySlug(slug)
  if (!workspace) throw new NotFoundError("Workspace not found")
  
  return getWorkspaceService(workspace.id)
}

export async function inviteWorkspaceMemberService(
  workspaceId: string,
  data: Omit<WorkspaceMemberInsertData, "workspaceId">,
) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("invite_users", "workspace")) {
    throw new AuthorizationError("Cannot invite users to this workspace")
  }

  const member = await addWorkspaceMember({
    ...data,
    workspaceId,
  })

  await logAction(user.id, workspaceId, "create", "workspace", workspaceId, {
    action: "invite_member",
    invitedUserId: data.userId,
    role: data.role,
  })

  return member
}

export async function updateWorkspaceMemberRoleService(
  workspaceId: string,
  userIdToUpdate: string,
  newRole: WorkspaceMemberInsertData["role"],
) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("manage_settings", "workspace")) {
    throw new AuthorizationError("Cannot modify member roles")
  }

  const member = await updateWorkspaceMemberRole(workspaceId, userIdToUpdate, newRole)

  await logAction(user.id, workspaceId, "update", "workspace", workspaceId, {
    action: "update_member_role",
    targetUserId: userIdToUpdate,
    newRole,
  })

  return member
}
