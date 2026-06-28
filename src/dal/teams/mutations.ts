import { db } from "@/drizzle/db"
import {
  TeamInsertData,
  TeamTable,
  TeamMemberInsertData,
  TeamMemberTable,
} from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

export async function createTeam(data: TeamInsertData) {
  const [team] = await db
    .insert(TeamTable)
    .values(data)
    .returning()

  return team
}

export async function updateTeam(teamId: string, data: Partial<TeamInsertData>) {
  const [team] = await db
    .update(TeamTable)
    .set(data)
    .where(eq(TeamTable.id, teamId))
    .returning()

  return team
}

export async function deleteTeam(teamId: string) {
  await db.delete(TeamTable).where(eq(TeamTable.id, teamId))
}

export async function addTeamMember(data: TeamMemberInsertData) {
  const [member] = await db
    .insert(TeamMemberTable)
    .values(data)
    .returning()

  return member
}

export async function removeTeamMember(teamId: string, userId: string) {
  await db
    .delete(TeamMemberTable)
    .where(
      and(eq(TeamMemberTable.teamId, teamId), eq(TeamMemberTable.userId, userId)),
    )
}
