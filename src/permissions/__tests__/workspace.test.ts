import { describe, it, expect } from "vitest"
import { subject } from "@casl/ability"
import {
  ownerAbility,
  adminAbility,
  memberAbility,
  guestAbility,
} from "./factories"

/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ WORKSPACE RBAC TESTS                                            │
 * │                                                                  │
 * │ Tests the pure RBAC permission matrix for workspace-level        │
 * │ actions. No team or document context — just role → action.       │
 * └──────────────────────────────────────────────────────────────────┘
 */
describe("Workspace RBAC", () => {
  describe("Owner", () => {
    const ability = ownerAbility()

    it("can manage workspace settings", () => {
      expect(ability.can("manage_settings", "workspace")).toBe(true)
    })
    it("can invite users", () => {
      expect(ability.can("invite_users", "workspace")).toBe(true)
    })
    it("can create teams", () => {
      expect(ability.can("create_teams", "workspace")).toBe(true)
    })
    it("can create projects", () => {
      expect(ability.can("create_projects", "workspace")).toBe(true)
    })
    it("can view members", () => {
      expect(ability.can("view_members", "workspace")).toBe(true)
    })
    it("can delete workspace", () => {
      expect(ability.can("delete", "workspace")).toBe(true)
    })
  })

  describe("Admin", () => {
    const ability = adminAbility()

    it("can manage workspace settings", () => {
      expect(ability.can("manage_settings", "workspace")).toBe(true)
    })
    it("can invite users", () => {
      expect(ability.can("invite_users", "workspace")).toBe(true)
    })
    it("can create teams", () => {
      expect(ability.can("create_teams", "workspace")).toBe(true)
    })
    it("CANNOT delete workspace", () => {
      expect(ability.can("delete", "workspace")).toBe(false)
    })
  })

  describe("Member", () => {
    const ability = memberAbility()

    it("CANNOT manage workspace settings", () => {
      expect(ability.can("manage_settings", "workspace")).toBe(false)
    })
    it("CANNOT invite users", () => {
      expect(ability.can("invite_users", "workspace")).toBe(false)
    })
    it("can create teams", () => {
      expect(ability.can("create_teams", "workspace")).toBe(true)
    })
    it("can create projects", () => {
      expect(ability.can("create_projects", "workspace")).toBe(true)
    })
    it("can view members", () => {
      expect(ability.can("view_members", "workspace")).toBe(true)
    })
    it("CANNOT delete workspace", () => {
      expect(ability.can("delete", "workspace")).toBe(false)
    })
  })

  describe("Guest", () => {
    const ability = guestAbility()

    it("CANNOT manage workspace settings", () => {
      expect(ability.can("manage_settings", "workspace")).toBe(false)
    })
    it("CANNOT invite users", () => {
      expect(ability.can("invite_users", "workspace")).toBe(false)
    })
    it("CANNOT create teams", () => {
      expect(ability.can("create_teams", "workspace")).toBe(false)
    })
    it("CANNOT create projects", () => {
      expect(ability.can("create_projects", "workspace")).toBe(false)
    })
    it("can view members", () => {
      expect(ability.can("view_members", "workspace")).toBe(true)
    })
    it("CANNOT delete workspace", () => {
      expect(ability.can("delete", "workspace")).toBe(false)
    })
  })
})
