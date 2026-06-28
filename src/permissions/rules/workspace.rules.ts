import type { AbilityBuilder, MongoAbility } from "@casl/ability"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import { hasMinWorkspaceRole } from "../roles"

type WorkspaceAbility = MongoAbility<
  [
    (
      | "manage_settings"
      | "invite_users"
      | "create_teams"
      | "create_projects"
      | "view_members"
      | "delete"
    ),
    "workspace",
  ]
>

type AllowFunction = AbilityBuilder<WorkspaceAbility>["can"]
type ForbidFunction = AbilityBuilder<WorkspaceAbility>["cannot"]

/**
 * Workspace-level permissions (pure RBAC — based on workspace role).
 *
 * | Action             | Owner | Admin | Member | Guest |
 * |--------------------|-------|-------|--------|-------|
 * | manage_settings    |   ✅  |   ✅  |   ❌   |   ❌  |
 * | invite_users       |   ✅  |   ✅  |   ❌   |   ❌  |
 * | create_teams       |   ✅  |   ✅  |   ✅   |   ❌  |
 * | create_projects    |   ✅  |   ✅  |   ✅   |   ❌  |
 * | view_members       |   ✅  |   ✅  |   ✅   |   ✅  |
 * | delete             |   ✅  |   ❌  |   ❌   |   ❌  |
 */
export function addWorkspaceRules(
  allow: AllowFunction,
  forbid: ForbidFunction,
  workspaceRole: WorkspaceRole,
) {
  // Everyone can view members
  allow("view_members", "workspace")

  if (workspaceRole === "guest") return

  // Members+ can create teams and projects
  if (hasMinWorkspaceRole(workspaceRole, "member")) {
    allow("create_teams", "workspace")
    allow("create_projects", "workspace")
  }

  // Admins+ can manage settings and invite users
  if (hasMinWorkspaceRole(workspaceRole, "admin")) {
    allow("manage_settings", "workspace")
    allow("invite_users", "workspace")
  }

  // Only owners can delete workspace
  if (workspaceRole === "owner") {
    allow("delete", "workspace")
  }
}
