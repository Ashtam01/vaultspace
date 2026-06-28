import type { AbilityBuilder, MongoAbility } from "@casl/ability"
import type { WorkspaceRole } from "@/drizzle/schema/workspace-member"
import type { TeamRole } from "@/drizzle/schema/team-member"
import type { Document } from "@/drizzle/schema/document"
import { hasMinWorkspaceRole } from "../roles"

type DocumentSubject =
  | "document"
  | Pick<
      Document,
      "projectId" | "creatorId" | "status" | "isLocked" | "sensitivity"
    >

type DocumentAbility = MongoAbility<
  [("create" | "read" | "update" | "delete"), DocumentSubject]
>

type AllowFunction = AbilityBuilder<DocumentAbility>["can"]
type ForbidFunction = AbilityBuilder<DocumentAbility>["cannot"]

type DocumentRuleContext = {
  userId: string
  workspaceRole: WorkspaceRole
  teamRole: TeamRole | null
  teamProjectIds: string[]
}

/**
 * Document-level permissions (ABAC — based on document attributes + user context).
 *
 * Uses CASL's `forbid()` for universal deny rules that override `allow()`.
 * This is the core differentiator — real enterprise systems need
 * "allow X, but deny Y even if X would match."
 */
export function addDocumentRules(
  allow: AllowFunction,
  forbid: ForbidFunction,
  context: DocumentRuleContext,
) {
  const { userId, workspaceRole, teamRole, teamProjectIds } = context

  // ─── Guest rules ────────────────────────────────────────────
  if (workspaceRole === "guest") {
    // Guests can only read published public/internal docs
    allow("read", "document", { status: "published", sensitivity: "public" })
    allow("read", "document", { status: "published", sensitivity: "internal" })

    // Guests CANNOT see confidential or restricted — ever
    forbid("read", "document", { sensitivity: "confidential" })
    forbid("read", "document", { sensitivity: "restricted" })
    return
  }

  // ─── Member base rules ─────────────────────────────────────
  // Members can read published + archived public/internal docs
  allow("read", "document", { status: "published", sensitivity: "public" })
  allow("read", "document", { status: "published", sensitivity: "internal" })
  allow("read", "document", { status: "archived", sensitivity: "public" })
  allow("read", "document", { status: "archived", sensitivity: "internal" })

  // Members can read + edit their OWN drafts (if not locked)
  allow("read", "document", { status: "draft", creatorId: userId })
  allow("read", "document", { status: "review", creatorId: userId })
  allow("create", "document")
  allow("update", "document", ["content", "title", "status"], {
    creatorId: userId,
    isLocked: false,
    status: "draft",
  })

  // ─── Team Lead rules ───────────────────────────────────────
  if (teamRole === "lead") {
    // Team leads can read ALL docs in their team's projects (including drafts)
    teamProjectIds.forEach((projectId) => {
      allow("read", "document", { projectId })
      allow("update", "document", ["content", "title", "status"], {
        projectId,
        isLocked: false,
      })
    })
  }

  // ─── Team Member rules ────────────────────────────────────
  if (teamRole === "member") {
    // Team members can read published/review docs in their team's projects
    teamProjectIds.forEach((projectId) => {
      allow("read", "document", { projectId, status: "published" })
      allow("read", "document", { projectId, status: "review" })
      allow("update", "document", ["content", "title"], {
        projectId,
        isLocked: false,
        status: "draft",
        creatorId: userId,
      })
    })
  }

  // ─── Admin rules ──────────────────────────────────────────
  if (hasMinWorkspaceRole(workspaceRole, "admin")) {
    allow("read", "document") // admins can read everything
    allow("update", "document", { isLocked: false })
    allow("delete", "document")

    // Admins can read confidential + restricted docs
    allow("read", "document", { sensitivity: "confidential" })
    allow("read", "document", { sensitivity: "restricted" })
  }

  // ─── Owner rules ──────────────────────────────────────────
  if (workspaceRole === "owner") {
    // Owners can even edit locked documents
    allow("update", "document")
  }

  // ─── UNIVERSAL DENY RULES (override all allows above) ─────
  // These use forbid() — CASL evaluates deny rules AFTER allow rules

  // Archived docs are read-only for EVERYONE (even owners)
  forbid("update", "document", { status: "archived" })
  forbid("delete", "document", { status: "archived" })

  // Locked docs can't be edited by anyone EXCEPT owners
  if (workspaceRole !== "owner") {
    forbid("update", "document", { isLocked: true })
  }

  // Members (non-admin) CANNOT see confidential or restricted docs
  if (!hasMinWorkspaceRole(workspaceRole, "admin")) {
    forbid("read", "document", { sensitivity: "confidential" })
    forbid("read", "document", { sensitivity: "restricted" })
  }
}
