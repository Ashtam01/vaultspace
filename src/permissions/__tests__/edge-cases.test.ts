import { describe, it, expect } from "vitest"
import { subject } from "@casl/ability"
import { buildAbility } from "./factories"

/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ EDGE CASE & CROSS-CUTTING TESTS                                 │
 * │                                                                  │
 * │ Tests for tricky scenarios that span multiple permission types:   │
 * │ - Cross-workspace isolation                                      │
 * │ - Deny overrides on combined conditions                          │
 * │ - Role hierarchy edge cases                                      │
 * │ - Multi-team membership                                          │
 * └──────────────────────────────────────────────────────────────────┘
 */

describe("Cross-workspace isolation", () => {
  it("a member with no team projects cannot read team-only project docs", () => {
    const ability = buildAbility({
      workspaceRole: "member",
      teamRole: null,
      teamProjectIds: [],
    })
    // They should NOT be able to read other users' drafts
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-x",
          creatorId: "other-user",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })

  it("team member only gets access to their own team's project IDs", () => {
    const ability = buildAbility({
      workspaceRole: "member",
      teamRole: "member",
      userTeamIds: ["team-a"],
      teamProjectIds: ["project-a"],
    })

    // Can read published in their project
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-a",
          creatorId: "other",
          status: "published",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)

    // Cannot read published in another team's project (if it's a draft by others)
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-b",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })
})

describe("Deny override edge cases", () => {
  it("archived + locked doc: even owner CANNOT update (archived wins)", () => {
    const ability = buildAbility({ workspaceRole: "owner" })
    expect(
      ability.can(
        "update",
        subject("document", {
          projectId: "p1",
          creatorId: "test-user-id",
          status: "archived",
          isLocked: true,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })

  it("confidential + published doc: member CANNOT read (sensitivity deny overrides)", () => {
    const ability = buildAbility({
      workspaceRole: "member",
      teamRole: "lead",
      teamProjectIds: ["p1"],
    })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "published",
          isLocked: false,
          sensitivity: "confidential",
        }),
      ),
    ).toBe(false)
  })

  it("restricted doc in team project: team lead CANNOT read (sensitivity deny overrides team access)", () => {
    const ability = buildAbility({
      workspaceRole: "member",
      teamRole: "lead",
      teamProjectIds: ["p1"],
    })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "restricted",
        }),
      ),
    ).toBe(false)
  })

  it("admin CAN read restricted doc (admin overrides sensitivity deny)", () => {
    const ability = buildAbility({ workspaceRole: "admin" })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "published",
          isLocked: false,
          sensitivity: "restricted",
        }),
      ),
    ).toBe(true)
  })
})

describe("Role hierarchy checks", () => {
  it("building with no role returns empty ability", () => {
    // Simulate the behaviour when workspaceRole doesn't match any case
    const ability = buildAbility({ workspaceRole: "guest" })
    // Guest has very limited permissions
    expect(ability.can("create", "document")).toBe(false)
    expect(ability.can("update", "document")).toBe(false)
    expect(ability.can("delete", "document")).toBe(false)
    expect(ability.can("create", "project")).toBe(false)
    expect(ability.can("create_teams", "workspace")).toBe(false)
  })
})

describe("Multi-team membership", () => {
  it("user in multiple teams gets access to all their teams' projects", () => {
    const ability = buildAbility({
      workspaceRole: "member",
      teamRole: "lead",
      userTeamIds: ["team-a", "team-b"],
      teamProjectIds: ["project-a", "project-b"],
    })

    // Can read docs in both projects
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-a",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)

    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-b",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)

    // Still cannot read docs in projects they're not in
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-c",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })
})
