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
 * │ DOCUMENT PERMISSION TESTS                                        │
 * │                                                                  │
 * │ The most complex permission surface in VaultSpace. Tests:        │
 * │ 1. RBAC: role-based read/write access                           │
 * │ 2. ABAC: sensitivity levels, locked state, archived status      │
 * │ 3. ReBAC: team membership → project → document access chains    │
 * │ 4. Deny overrides: forbid() rules that override allow()         │
 * └──────────────────────────────────────────────────────────────────┘
 */

// ─── RBAC: Basic role-based document access ────────────────────
describe("Document RBAC", () => {
  it("owner can read any document", () => {
    const ability = ownerAbility()
    expect(ability.can("read", "document")).toBe(true)
  })

  it("owner can update any non-archived document", () => {
    const ability = ownerAbility()
    expect(
      ability.can(
        "update",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)
  })

  it("admin can read any document", () => {
    const ability = adminAbility()
    expect(ability.can("read", "document")).toBe(true)
  })

  it("admin can delete documents", () => {
    const ability = adminAbility()
    expect(ability.can("delete", "document")).toBe(true)
  })

  it("member can create documents", () => {
    const ability = memberAbility()
    expect(ability.can("create", "document")).toBe(true)
  })

  it("guest CANNOT create documents", () => {
    const ability = guestAbility()
    expect(ability.can("create", "document")).toBe(false)
  })

  it("guest CANNOT delete documents", () => {
    const ability = guestAbility()
    expect(ability.can("delete", "document")).toBe(false)
  })
})

// ─── ABAC: Sensitivity-based access ───────────────────────────
describe("Document ABAC — Sensitivity", () => {
  it("guest can read published public documents", () => {
    const ability = guestAbility()
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "published",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)
  })

  it("guest can read published internal documents", () => {
    const ability = guestAbility()
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "other",
          status: "published",
          isLocked: false,
          sensitivity: "internal",
        }),
      ),
    ).toBe(true)
  })

  it("guest CANNOT read confidential documents", () => {
    const ability = guestAbility()
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

  it("guest CANNOT read restricted documents", () => {
    const ability = guestAbility()
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
    ).toBe(false)
  })

  it("member CANNOT read confidential documents", () => {
    const ability = memberAbility()
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

  it("member CANNOT read restricted documents", () => {
    const ability = memberAbility()
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
    ).toBe(false)
  })

  it("admin CAN read confidential documents", () => {
    const ability = adminAbility()
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
    ).toBe(true)
  })

  it("admin CAN read restricted documents", () => {
    const ability = adminAbility()
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

// ─── ABAC: Locked document protection ─────────────────────────
describe("Document ABAC — Locked Documents", () => {
  const lockedDoc = {
    projectId: "p1",
    creatorId: "test-user-id",
    status: "draft" as const,
    isLocked: true,
    sensitivity: "public" as const,
  }

  it("member CANNOT update a locked document", () => {
    const ability = memberAbility()
    expect(ability.can("update", subject("document", lockedDoc))).toBe(false)
  })

  it("admin CANNOT update a locked document", () => {
    const ability = adminAbility()
    expect(ability.can("update", subject("document", lockedDoc))).toBe(false)
  })

  it("owner CAN update a locked document", () => {
    const ability = ownerAbility()
    expect(ability.can("update", subject("document", lockedDoc))).toBe(true)
  })
})

// ─── ABAC: Archived document immutability ─────────────────────
describe("Document ABAC — Archived Immutability", () => {
  const archivedDoc = {
    projectId: "p1",
    creatorId: "test-user-id",
    status: "archived" as const,
    isLocked: false,
    sensitivity: "public" as const,
  }

  it("owner CANNOT update an archived document", () => {
    const ability = ownerAbility()
    expect(ability.can("update", subject("document", archivedDoc))).toBe(false)
  })

  it("admin CANNOT update an archived document", () => {
    const ability = adminAbility()
    expect(ability.can("update", subject("document", archivedDoc))).toBe(false)
  })

  it("owner CANNOT delete an archived document", () => {
    const ability = ownerAbility()
    expect(ability.can("delete", subject("document", archivedDoc))).toBe(false)
  })

  it("admin can read an archived document", () => {
    const ability = adminAbility()
    expect(ability.can("read", subject("document", archivedDoc))).toBe(true)
  })
})

// ─── ABAC: Draft ownership ────────────────────────────────────
describe("Document ABAC — Draft Ownership", () => {
  it("member can read their own draft", () => {
    const ability = memberAbility({ userId: "user-1" })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "user-1",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)
  })

  it("member CANNOT read another user's draft", () => {
    const ability = memberAbility({ userId: "user-1" })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "p1",
          creatorId: "user-2",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })

  it("member can update their own unlocked draft", () => {
    const ability = memberAbility({ userId: "user-1" })
    expect(
      ability.can(
        "update",
        subject("document", {
          projectId: "p1",
          creatorId: "user-1",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)
  })

  it("member CANNOT update another user's draft", () => {
    const ability = memberAbility({ userId: "user-1" })
    expect(
      ability.can(
        "update",
        subject("document", {
          projectId: "p1",
          creatorId: "user-2",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })
})

// ─── ReBAC: Team → Project → Document access chains ───────────
describe("Document ReBAC — Team Access Chains", () => {
  it("team lead can read any doc in their team's project", () => {
    const ability = teamLeadAbility({ teamProjectIds: ["project-a"] })
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
  })

  it("team lead CANNOT read docs in another team's project", () => {
    const ability = teamLeadAbility({ teamProjectIds: ["project-a"] })
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

  it("team lead can update unlocked docs in their team's project", () => {
    const ability = teamLeadAbility({ teamProjectIds: ["project-a"] })
    expect(
      ability.can(
        "update",
        subject("document", {
          projectId: "project-a",
          creatorId: "other",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(true)
  })

  it("team member can read published docs in their team's project", () => {
    const ability = teamMemberAbility({ teamProjectIds: ["project-a"] })
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
  })

  it("team member CANNOT read draft docs by others in their team's project", () => {
    const ability = teamMemberAbility({
      userId: "user-1",
      teamProjectIds: ["project-a"],
    })
    expect(
      ability.can(
        "read",
        subject("document", {
          projectId: "project-a",
          creatorId: "user-2",
          status: "draft",
          isLocked: false,
          sensitivity: "public",
        }),
      ),
    ).toBe(false)
  })
})
