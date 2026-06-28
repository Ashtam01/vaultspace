import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { WorkspaceTable } from "./workspace"
import { UserTable } from "./user"

export const workspaceRoles = ["owner", "admin", "member", "guest"] as const
export type WorkspaceRole = (typeof workspaceRoles)[number]
export const workspaceRoleEnum = pgEnum("workspace_role", workspaceRoles)

export const WorkspaceMemberTable = pgTable("workspace_members", {
  id,
  workspaceId: uuid()
    .notNull()
    .references(() => WorkspaceTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  role: workspaceRoleEnum().notNull().default("member"),
  joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const WorkspaceMemberRelationships = relations(
  WorkspaceMemberTable,
  ({ one }) => ({
    workspace: one(WorkspaceTable, {
      fields: [WorkspaceMemberTable.workspaceId],
      references: [WorkspaceTable.id],
    }),
    user: one(UserTable, {
      fields: [WorkspaceMemberTable.userId],
      references: [UserTable.id],
    }),
  }),
)

export type WorkspaceMember = typeof WorkspaceMemberTable.$inferSelect
export type WorkspaceMemberInsertData =
  typeof WorkspaceMemberTable.$inferInsert
