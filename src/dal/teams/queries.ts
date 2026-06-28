import { db } from "@/drizzle/db"
import { TeamTable, TeamMemberTable } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

export async function getTeamById(id: string) {
  return db.query.TeamTable.findFirst({
    where: eq(TeamTable.id, id),
  })
}

export async function getWorkspaceTeams(workspaceId: string) {
  return db.query.TeamTable.findMany({
    where: eq(TeamTable.workspaceId, workspaceId),
  })
}

export async function getTeamMembers(teamId: string) {
  return db.query.TeamMemberTable.findMany({
    where: eq(TeamMemberTable.teamId, teamId),
    with: {
      user: true,
    },
  })
}

export async function getUserTeams(workspaceId: string, userId: string) {
  return db
    .select({
      team: TeamTable,
      role: TeamMemberTable.role,
    })
    .from(TeamMemberTable)
    .innerJoin(TeamTable, eq(TeamMemberTable.teamId, TeamTable.id))
    .where(
      and(
        eq(TeamMemberTable.userId, userId),
        eq(TeamTable.workspaceId, workspaceId),
      ),
    )
}
