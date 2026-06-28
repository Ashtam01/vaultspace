import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { WorkspaceTable } from "./workspace"
import { UserTable } from "./user"

export const auditResourceTypes = [
  "document",
  "project",
  "team",
  "workspace",
] as const
export type AuditResourceType = (typeof auditResourceTypes)[number]
export const auditResourceTypeEnum = pgEnum(
  "audit_resource_type",
  auditResourceTypes,
)

export const auditActions = [
  "create",
  "read",
  "update",
  "delete",
  "share",
  "export",
] as const
export type AuditAction = (typeof auditActions)[number]
export const auditActionEnum = pgEnum("audit_action", auditActions)

export const AuditLogTable = pgTable("audit_logs", {
  id,
  workspaceId: uuid()
    .notNull()
    .references(() => WorkspaceTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  resourceId: uuid().notNull(),
  resourceType: auditResourceTypeEnum().notNull(),
  action: auditActionEnum().notNull(),
  metadata: jsonb().$type<Record<string, unknown>>(),
  ipAddress: text(),
  performedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const AuditLogRelationships = relations(AuditLogTable, ({ one }) => ({
  workspace: one(WorkspaceTable, {
    fields: [AuditLogTable.workspaceId],
    references: [WorkspaceTable.id],
  }),
  user: one(UserTable, {
    fields: [AuditLogTable.userId],
    references: [UserTable.id],
  }),
}))

export type AuditLog = typeof AuditLogTable.$inferSelect
export type AuditLogInsertData = typeof AuditLogTable.$inferInsert
