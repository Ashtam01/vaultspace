import type { AbilityBuilder, MongoAbility } from "@casl/ability"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"
import { hasMinWorkspaceRole } from "../roles"

type TeamAbility = MongoAbility<
  [
    ("create" | "read" | "update" | "delete" | "manage_members"),
    "team",
  ]
>

type AllowFunction = AbilityBuilder<TeamAbility>["can"]
type ForbidFunction = AbilityBuilder<TeamAbility>["cannot"]

type TeamRuleContext = {
  workspaceRole: WorkspaceRole
  teamRole: TeamRole | null
}

/**
 * Team-level permissions.
 *
 * | Action          | Owner | Admin | Member (lead) | Member (member) | Guest |
 * |-----------------|-------|-------|---------------|-----------------|-------|
 * | read            |   ✅  |   ✅  |      ✅       |       ✅        |   ✅  |
 * | create          |   ✅  |   ✅  |      ✅       |       ❌        |   ❌  |
 * | update          |   ✅  |   ✅  |      ✅       |       ❌        |   ❌  |
 * | delete          |   ✅  |   ✅  |      ❌       |       ❌        |   ❌  |
 * | manage_members  |   ✅  |   ✅  |      ✅       |       ❌        |   ❌  |
 */
export function addTeamRules(
  allow: AllowFunction,
  forbid: ForbidFunction,
  context: TeamRuleContext,
) {
  const { workspaceRole, teamRole } = context

  // Everyone can view teams
  allow("read", "team")

  if (workspaceRole === "guest") return

  // Team leads can update team info and manage members
  if (teamRole === "lead") {
    allow("update", "team")
    allow("manage_members", "team")
  }

  // Members+ can create teams (workspace-level permission, also handled here)
  if (hasMinWorkspaceRole(workspaceRole, "member")) {
    allow("create", "team")
  }

  // Admins+ get full control
  if (hasMinWorkspaceRole(workspaceRole, "admin")) {
    allow("update", "team")
    allow("delete", "team")
    allow("manage_members", "team")
  }
}
