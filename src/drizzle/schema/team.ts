import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { createdAt, id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { WorkspaceTable } from "./workspace"
import { TeamMemberTable } from "./team-member"
import { ProjectTable } from "./project"

export const TeamTable = pgTable("teams", {
  id,
  workspaceId: uuid()
    .notNull()
    .references(() => WorkspaceTable.id, { onDelete: "cascade" }),
  name: text().notNull(),
  description: text(),
  createdAt,
})

export const TeamRelationships = relations(TeamTable, ({ one, many }) => ({
  workspace: one(WorkspaceTable, {
    fields: [TeamTable.workspaceId],
    references: [WorkspaceTable.id],
  }),
  members: many(TeamMemberTable),
  projects: many(ProjectTable),
}))

export type Team = typeof TeamTable.$inferSelect
export type TeamInsertData = typeof TeamTable.$inferInsert
