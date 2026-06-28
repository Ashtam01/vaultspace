/**
 * Test factories for building CASL abilities with specific contexts.
 *
 * These let us test the permission rules in isolation — no DB, no HTTP,
 * just pure "given this role/context, can the user do X?"
 */
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import type { AppAbility } from "@/permissions/casl"
import { addWorkspaceRules } from "@/permissions/rules/workspace.rules"
import { addTeamRules } from "@/permissions/rules/team.rules"
import { addProjectRules } from "@/permissions/rules/project.rules"
import { addDocumentRules } from "@/permissions/rules/document.rules"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"

export type TestContext = {
  userId?: string
  workspaceRole: WorkspaceRole
  teamRole?: TeamRole | null
  userTeamIds?: string[]
  teamProjectIds?: string[]
}

const DEFAULTS = {
  userId: "test-user-id",
  teamRole: null as TeamRole | null,
  userTeamIds: [] as string[],
  teamProjectIds: [] as string[],
}

/**
 * Build a full CASL ability using the same rule functions the app uses.
 * This is the core of our testing strategy: we test the *rules*, not the DB wiring.
 */
export function buildAbility(ctx: TestContext): AppAbility {
  const merged = { ...DEFAULTS, ...ctx }
  const { build, can, cannot } = new AbilityBuilder<AppAbility>(createMongoAbility)

  // @ts-expect-error CASL types are tricky across files
  addWorkspaceRules(can, cannot, merged.workspaceRole)
  // @ts-expect-error
  addTeamRules(can, cannot, {
    workspaceRole: merged.workspaceRole,
    teamRole: merged.teamRole,
  })
  // @ts-expect-error
  addProjectRules(can, cannot, {
    workspaceRole: merged.workspaceRole,
    teamRole: merged.teamRole,
    userTeamIds: merged.userTeamIds,
  })
  // @ts-expect-error
  addDocumentRules(can, cannot, {
    userId: merged.userId,
    workspaceRole: merged.workspaceRole,
    teamRole: merged.teamRole,
    teamProjectIds: merged.teamProjectIds,
  })

  return build()
}

// ─── Preset builders for common test scenarios ───────────────
export function ownerAbility(overrides?: Partial<TestContext>) {
  return buildAbility({ workspaceRole: "owner", ...overrides })
}

export function adminAbility(overrides?: Partial<TestContext>) {
  return buildAbility({ workspaceRole: "admin", ...overrides })
}

export function memberAbility(overrides?: Partial<TestContext>) {
  return buildAbility({ workspaceRole: "member", ...overrides })
}

export function guestAbility(overrides?: Partial<TestContext>) {
  return buildAbility({ workspaceRole: "guest", ...overrides })
}

export function teamLeadAbility(overrides?: Partial<TestContext>) {
  return buildAbility({
    workspaceRole: "member",
    teamRole: "lead",
    userTeamIds: ["team-a"],
    teamProjectIds: ["project-a"],
    ...overrides,
  })
}

export function teamMemberAbility(overrides?: Partial<TestContext>) {
  return buildAbility({
    workspaceRole: "member",
    teamRole: "member",
    userTeamIds: ["team-a"],
    teamProjectIds: ["project-a"],
    ...overrides,
  })
}
