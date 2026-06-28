import { getCurrentUser } from "@/lib/session"
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import {
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "@/dal/teams/mutations"
import { getTeamById } from "@/dal/teams/queries"
import { logAction } from "./audit"
import { TeamInsertData, TeamMemberInsertData } from "@/drizzle/schema"
import { subject } from "@casl/ability"

export async function createTeamService(workspaceId: string, data: Omit<TeamInsertData, "workspaceId">) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("create_teams", "workspace")) {
    throw new AuthorizationError("Cannot create teams in this workspace")
  }

  const team = await createTeam({
    ...data,
    workspaceId,
  })

  // Creator automatically becomes lead
  await addTeamMember({
    teamId: team.id,
    userId: user.id,
    role: "lead",
  })

  await logAction(user.id, workspaceId, "create", "team", team.id, {
    name: team.name,
  })

  return team
}

export async function updateTeamService(workspaceId: string, teamId: string, data: Partial<TeamInsertData>) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const team = await getTeamById(teamId)
  if (!team || team.workspaceId !== workspaceId) throw new NotFoundError("Team not found")

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("update", subject("team", team))) {
    throw new AuthorizationError("Cannot update this team")
  }

  const updatedTeam = await updateTeam(teamId, data)
  
  await logAction(user.id, workspaceId, "update", "team", teamId, data)

  return updatedTeam
}

export async function deleteTeamService(workspaceId: string, teamId: string) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const team = await getTeamById(teamId)
  if (!team || team.workspaceId !== workspaceId) throw new NotFoundError("Team not found")

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("delete", subject("team", team))) {
    throw new AuthorizationError("Cannot delete this team")
  }

  await deleteTeam(teamId)
  
  await logAction(user.id, workspaceId, "delete", "team", teamId, { name: team.name })
}

export async function addTeamMemberService(
  workspaceId: string,
  teamId: string,
  data: Omit<TeamMemberInsertData, "teamId">,
) {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()

  const team = await getTeamById(teamId)
  if (!team || team.workspaceId !== workspaceId) throw new NotFoundError("Team not found")

  const ability = await getUserWorkspacePermissions(workspaceId)
  if (ability.cannot("manage_members", subject("team", team))) {
    throw new AuthorizationError("Cannot manage members of this team")
  }

  const member = await addTeamMember({
    ...data,
    teamId,
  })

  await logAction(user.id, workspaceId, "update", "team", teamId, {
    action: "add_member",
    addedUserId: data.userId,
    role: data.role,
  })

  return member
}
