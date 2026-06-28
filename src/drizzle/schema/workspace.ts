import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { createdAt, id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { WorkspaceMemberTable } from "./workspace-member"
import { TeamTable } from "./team"
import { ProjectTable } from "./project"

export const WorkspaceTable = pgTable("workspaces", {
  id,
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdById: uuid().notNull(),
  createdAt,
})

export const WorkspaceRelationships = relations(
  WorkspaceTable,
  ({ many }) => ({
    members: many(WorkspaceMemberTable),
    teams: many(TeamTable),
    projects: many(ProjectTable),
  }),
)

export type Workspace = typeof WorkspaceTable.$inferSelect
export type WorkspaceInsertData = typeof WorkspaceTable.$inferInsert
