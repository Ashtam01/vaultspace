import { pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserTable } from "./user"
import { DocumentTable } from "./document"
import { WorkspaceTable } from "./workspace"
import { TeamTable } from "./team"

export const projectVisibilities = ["team", "workspace", "public"] as const
export type ProjectVisibility = (typeof projectVisibilities)[number]
export const projectVisibilityEnum = pgEnum(
  "project_visibility",
  projectVisibilities,
)

export const ProjectTable = pgTable("projects", {
  id,
  name: text().notNull(),
  description: text().notNull(),
  ownerId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  department: text(),
  workspaceId: uuid().references(() => WorkspaceTable.id, {
    onDelete: "cascade",
  }),
  teamId: uuid().references(() => TeamTable.id, { onDelete: "set null" }),
  visibility: projectVisibilityEnum().notNull().default("workspace"),
  createdAt,
  updatedAt,
})

export const ProjectRelationships = relations(
  ProjectTable,
  ({ many, one }) => ({
    owner: one(UserTable, {
      fields: [ProjectTable.ownerId],
      references: [UserTable.id],
    }),
    workspace: one(WorkspaceTable, {
      fields: [ProjectTable.workspaceId],
      references: [WorkspaceTable.id],
    }),
    team: one(TeamTable, {
      fields: [ProjectTable.teamId],
      references: [TeamTable.id],
    }),
    documents: many(DocumentTable),
  }),
)

export type Project = typeof ProjectTable.$inferSelect
export type ProjectInsertData = typeof ProjectTable.$inferInsert
