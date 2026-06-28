import { describe, it, expect } from "vitest"
import { subject } from "@casl/ability"
import {
  ownerAbility,
  adminAbility,
  memberAbility,
  guestAbility,
  teamLeadAbility,
  teamMemberAbility,
} from "./factories"

/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ PROJECT PERMISSION TESTS                                         │
 * │                                                                  │
 * │ Tests project-level access which combines RBAC + ReBAC:          │
 * │ - Visibility controls (team/workspace/public)                    │
 * │ - Team membership checks for team-visible projects               │
 * └──────────────────────────────────────────────────────────────────┘
 */
describe("Project RBAC", () => {
  it("owner has full CRUD on projects", () => {
    const ability = ownerAbility()
    expect(ability.can("create", "project")).toBe(true)
    expect(ability.can("read", "project")).toBe(true)
    expect(ability.can("update", "project")).toBe(true)
    expect(ability.can("delete", "project")).toBe(true)
  })

  it("admin has full CRUD on projects", () => {
    const ability = adminAbility()
    expect(ability.can("create", "project")).toBe(true)
    expect(ability.can("read", "project")).toBe(true)
    expect(ability.can("update", "project")).toBe(true)
    expect(ability.can("delete", "project")).toBe(true)
  })

  it("member can create and read, but not update/delete", () => {
    const ability = memberAbility()
    expect(ability.can("create", "project")).toBe(true)
    expect(ability.can("update", "project")).toBe(false)
    expect(ability.can("delete", "project")).toBe(false)
  })

  it("guest CANNOT create projects", () => {
    const ability = guestAbility()
    expect(ability.can("create", "project")).toBe(false)
  })

  it("guest CANNOT update or delete projects", () => {
    const ability = guestAbility()
    expect(ability.can("update", "project")).toBe(false)
    expect(ability.can("delete", "project")).toBe(false)
  })
})

describe("Project Visibility — ReBAC", () => {
  it("guest can read workspace-visible projects", () => {
    const ability = guestAbility()
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-x",
          visibility: "workspace",
        }),
      ),
    ).toBe(true)
  })

  it("guest can read public projects", () => {
    const ability = guestAbility()
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-x",
          visibility: "public",
        }),
      ),
    ).toBe(true)
  })

  it("guest CANNOT read team-visible projects", () => {
    const ability = guestAbility()
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-x",
          visibility: "team",
        }),
      ),
    ).toBe(false)
  })

  it("member in team-a can read team-a's team-visible project", () => {
    const ability = teamMemberAbility({ userTeamIds: ["team-a"] })
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-a",
          visibility: "team",
        }),
      ),
    ).toBe(true)
  })

  it("member in team-a CANNOT read team-b's team-visible project", () => {
    const ability = teamMemberAbility({ userTeamIds: ["team-a"] })
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-b",
          visibility: "team",
        }),
      ),
    ).toBe(false)
  })

  it("admin can read any project regardless of visibility", () => {
    const ability = adminAbility()
    expect(
      ability.can(
        "read",
        subject("project", {
          department: null,
          teamId: "team-x",
          visibility: "team",
        }),
      ),
    ).toBe(true)
  })
})

/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ TEAM PERMISSION TESTS                                            │
 * └──────────────────────────────────────────────────────────────────┘
 */
describe("Team RBAC", () => {
  it("everyone can read teams", () => {
    expect(guestAbility().can("read", "team")).toBe(true)
    expect(memberAbility().can("read", "team")).toBe(true)
    expect(adminAbility().can("read", "team")).toBe(true)
    expect(ownerAbility().can("read", "team")).toBe(true)
  })

  it("guest CANNOT create teams", () => {
    expect(guestAbility().can("create", "team")).toBe(false)
  })

  it("member can create teams", () => {
    expect(memberAbility().can("create", "team")).toBe(true)
  })

  it("team lead can update team and manage members", () => {
    const ability = teamLeadAbility()
    expect(ability.can("update", "team")).toBe(true)
    expect(ability.can("manage_members", "team")).toBe(true)
  })

  it("team lead CANNOT delete team", () => {
    const ability = teamLeadAbility()
    expect(ability.can("delete", "team")).toBe(false)
  })

  it("admin can delete teams", () => {
    const ability = adminAbility()
    expect(ability.can("delete", "team")).toBe(true)
  })

  it("admin can manage team members", () => {
    const ability = adminAbility()
    expect(ability.can("manage_members", "team")).toBe(true)
  })
})
