<p align="center">
  <img src="public/letter-v.svg" width="128" height="128" alt="VaultSpace Logo" />
</p>

<h1 align="center">🔐 VaultSpace</h1>

A multi-tenant team workspace with **enterprise-grade permissions** — demonstrating RBAC, ABAC, and ReBAC in a real Next.js application.

## Why This Project?

Most permission tutorials stop at basic role checks. VaultSpace implements the same layered permission model used at companies like Google, GitHub, and Notion:

| Model | What it controls | Example |
|-------|-----------------|---------|
| **RBAC** | Workspace-level roles | Owner → Admin → Member → Guest |
| **ABAC** | Document attributes | Sensitivity levels, locked state, archived immutability |
| **ReBAC** | Relationship chains | User → Team → Project → Document access |

> *"I took a course on permission systems and realized most implementations stop at RBAC. VaultSpace layers all three models using CASL's `allow/forbid` pattern, where deny rules override allows — exactly how enterprise systems work."*

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (Server Components)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Pages/Routes │  │  Components  │  │ Server Actions│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘ │
│         │                 │                  │          │
│  ┌──────▼─────────────────▼──────────────────▼────────┐ │
│  │              Service Layer                          │ │
│  │  (Authorization checks + Audit logging)             │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────────┐ │
│  │           Permission Engine (CASL)                  │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │ │
│  │  │ Rules      │ │ ReBAC      │ │ Role Hierarchy │  │ │
│  │  │ (per-      │ │ Resolver   │ │ (roles.ts)     │  │ │
│  │  │ resource)  │ │ (rebac.ts) │ │                │  │ │
│  │  └────────────┘ └────────────┘ └────────────────┘  │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼─────────────────────────────┐ │
│  │              Data Access Layer (DAL)                │ │
│  │          Drizzle ORM + PostgreSQL                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Permission Model Deep Dive

### RBAC: Workspace Roles

| Action | Owner | Admin | Member | Guest |
|---|:---:|:---:|:---:|:---:|
| Manage settings | ✅ | ✅ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ |
| Create teams | ✅ | ✅ | ✅ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ |
| View members | ✅ | ✅ | ✅ | ✅ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |

### ABAC: Document Attributes

- **Sensitivity Levels**: `public` → `internal` → `confidential` → `restricted`
  - Guests: public + internal only
  - Members: public + internal only
  - Admins+: all levels
- **Locked Documents**: Only workspace owners can edit locked docs
- **Archived Documents**: Nobody can edit or delete — enforced via `forbid()` rules that override all `allow()` rules

### ReBAC: Relationship-Based Access

```
User ─memberOf→ Team ─owns→ Project ─contains→ Document
```

The `rebac.ts` resolver performs a single-query traversal:
```sql
User → WorkspaceMember → TeamMember → Team → Project
```
This returns the user's `teamProjectIds` — the set of project IDs the user can access through their team memberships.

### Deny Override Pattern

The most interesting architectural decision: CASL evaluates `forbid()` rules **after** `allow()` rules. This means:

```typescript
allow("update", "document")           // Owner can update anything
forbid("update", "document", { status: "archived" })  // But NOT archived docs
```

Even the workspace owner cannot edit an archived document. This mirrors how enterprise systems implement compliance rules.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Database | PostgreSQL + Drizzle ORM |
| Permissions | CASL (`@casl/ability`) |
| Auth | Cookie-based sessions (demo quick-login) |
| UI | shadcn/ui + Tailwind CSS |
| Testing | Vitest (79 test cases) |
| Validation | Zod |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Setup

```bash
# Clone and install
git clone https://github.com/Ashtam01/vaultspace.git
cd vaultspace
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Run Tests

```bash
npm test           # Run all 79 permission tests
npm run test:watch # Watch mode
```

---

## Project Structure

```
src/
├── permissions/
│   ├── casl.ts              # Core permission engine
│   ├── rebac.ts             # ReBAC relationship resolver
│   ├── roles.ts             # Role hierarchy definitions
│   └── rules/
│       ├── workspace.rules.ts  # RBAC workspace permissions
│       ├── team.rules.ts       # Team RBAC + lead/member
│       ├── project.rules.ts    # Project visibility (ReBAC)
│       └── document.rules.ts   # ABAC document permissions
│
├── drizzle/
│   ├── schema/              # 8 schema files (multi-tenant)
│   └── seed.ts              # Demo data with conflict scenarios
│
├── services/                # Authorization + audit logging
├── dal/                     # Data Access Layer (queries + mutations)
├── components/              # UI with PermissionGate, SensitivityBadge
└── app/
    ├── (dashboard)/[workspaceSlug]/  # Workspace-scoped routes
    └── workspaces/                    # Workspace picker
```

---

## Test Coverage

**79 test cases** across 4 test suites:

| Suite | Tests | What it covers |
|-------|:-----:|----------------|
| Workspace RBAC | 22 | Full role × action permission matrix |
| Document Permissions | 31 | RBAC + ABAC (sensitivity, locks, archives, drafts) + ReBAC |
| Project + Team | 18 | Visibility controls, team access chains |
| Edge Cases | 8 | Cross-workspace isolation, deny overrides, multi-team |

---

## Key Design Decisions

1. **Rule files are pure functions** — they take `allow/forbid` builders and a context object. No DB, no HTTP. This makes them trivially testable (79 tests run in <20ms).

2. **ReBAC as a single query** — instead of N+1 queries per relationship hop, `rebac.ts` resolves the full `User → Team → Project` chain in one DB call.

3. **`forbid()` for compliance rules** — archived immutability and sensitivity restrictions use deny rules that override all allows, matching how real enterprise systems enforce policy.

4. **Audit logging as a cross-cutting concern** — every mutation flows through a service layer that logs `who did what, when, to which resource`.

---

## Author

**Ashtam Pati Tiwari** — [GitHub](https://github.com/Ashtam01)

## License

MIT
