import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"

/**
 * Role hierarchy — higher number = more privileges.
 * Used for hasMinRole() checks in permission rules.
 */
export const WORKSPACE_ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  guest: 1,
} as const

export const TEAM_ROLE_HIERARCHY: Record<TeamRole, number> = {
  lead: 2,
  member: 1,
} as const

/**
 * Check if a user's workspace role meets or exceeds the required role.
 * Example: hasMinWorkspaceRole("admin", "member") → true
 */
export function hasMinWorkspaceRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean {
  return WORKSPACE_ROLE_HIERARCHY[userRole] >= WORKSPACE_ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user's team role meets or exceeds the required role.
 */
export function hasMinTeamRole(
  userRole: TeamRole,
  requiredRole: TeamRole,
): boolean {
  return TEAM_ROLE_HIERARCHY[userRole] >= TEAM_ROLE_HIERARCHY[requiredRole]
}
