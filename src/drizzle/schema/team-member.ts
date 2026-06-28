import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { TeamTable } from "./team"
import { UserTable } from "./user"

export const teamRoles = ["lead", "member"] as const
export type TeamRole = (typeof teamRoles)[number]
export const teamRoleEnum = pgEnum("team_role", teamRoles)

export const TeamMemberTable = pgTable("team_members", {
  id,
  teamId: uuid()
    .notNull()
    .references(() => TeamTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  role: teamRoleEnum().notNull().default("member"),
  joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const TeamMemberRelationships = relations(
  TeamMemberTable,
  ({ one }) => ({
    team: one(TeamTable, {
      fields: [TeamMemberTable.teamId],
      references: [TeamTable.id],
    }),
    user: one(UserTable, {
      fields: [TeamMemberTable.userId],
      references: [UserTable.id],
    }),
  }),
)

export type TeamMember = typeof TeamMemberTable.$inferSelect
export type TeamMemberInsertData = typeof TeamMemberTable.$inferInsert
