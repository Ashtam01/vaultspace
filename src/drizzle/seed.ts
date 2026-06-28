import "dotenv/config"
import { db } from "./db"
import {
  UserTable,
  DocumentTable,
  ProjectTable,
  WorkspaceTable,
  WorkspaceMemberTable,
  TeamTable,
  TeamMemberTable,
} from "./schema"

async function seed() {
  console.log("🌱 Seeding database...")

  // Clear existing data (order matters for foreign keys)
  await db.delete(DocumentTable)
  await db.delete(ProjectTable)
  await db.delete(TeamMemberTable)
  await db.delete(TeamTable)
  await db.delete(WorkspaceMemberTable)
  await db.delete(WorkspaceTable)
  await db.delete(UserTable)
  console.log("✓ Cleared existing data")

  // ─── Users ────────────────────────────────────────────────────
  const users = await db
    .insert(UserTable)
    .values([
      {
        email: "ashtam@vaultspace.io",
        name: "Ashtam",
        role: "admin",
        department: "Engineering",
      },
      {
        email: "abhinav@vaultspace.io",
        name: "Abhinav",
        role: "author",
        department: "Engineering",
      },
      {
        email: "kirtiman@vaultspace.io",
        name: "Kirtiman",
        role: "editor",
        department: "Engineering",
      },
      {
        email: "nikunj@vaultspace.io",
        name: "Nikunj",
        role: "viewer",
        department: "Engineering",
      },
      {
        email: "tanish@vaultspace.io",
        name: "Tanish",
        role: "admin",
        department: "Marketing",
      },
      {
        email: "neha@vaultspace.io",
        name: "Neha",
        role: "author",
        department: "Marketing",
      },
      {
        email: "anusha@vaultspace.io",
        name: "Anusha",
        role: "editor",
        department: "Marketing",
      },
      {
        email: "kajal@vaultspace.io",
        name: "Kajal",
        role: "viewer",
        department: "Marketing",
      },
    ])
    .returning()

  console.log(`✓ Created ${users.length} users`)

  const getUser = (email: string) => users.find((u) => u.email === email)!

  // ─── Workspaces ───────────────────────────────────────────────
  const workspaces = await db
    .insert(WorkspaceTable)
    .values([
      {
        name: "Acme Corp",
        slug: "acme-corp",
        createdById: getUser("ashtam@vaultspace.io").id,
      },
      {
        name: "Side Project Labs",
        slug: "side-project-labs",
        createdById: getUser("tanish@vaultspace.io").id,
      },
    ])
    .returning()

  console.log(`✓ Created ${workspaces.length} workspaces`)

  const getWorkspace = (slug: string) =>
    workspaces.find((w) => w.slug === slug)!

  const acme = getWorkspace("acme-corp")
  const sideLabs = getWorkspace("side-project-labs")

  // ─── Workspace Members ────────────────────────────────────────
  // Key conflict scenario: Ashtam is OWNER in Acme but GUEST in Side Project Labs
  // Tanish is OWNER in Side Project Labs but ADMIN in Acme
  const workspaceMembers = await db
    .insert(WorkspaceMemberTable)
    .values([
      // Acme Corp members
      {
        workspaceId: acme.id,
        userId: getUser("ashtam@vaultspace.io").id,
        role: "owner",
      },
      {
        workspaceId: acme.id,
        userId: getUser("abhinav@vaultspace.io").id,
        role: "admin",
      },
      {
        workspaceId: acme.id,
        userId: getUser("kirtiman@vaultspace.io").id,
        role: "member",
      },
      {
        workspaceId: acme.id,
        userId: getUser("nikunj@vaultspace.io").id,
        role: "member",
      },
      {
        workspaceId: acme.id,
        userId: getUser("tanish@vaultspace.io").id,
        role: "admin",
      },
      {
        workspaceId: acme.id,
        userId: getUser("neha@vaultspace.io").id,
        role: "member",
      },
      {
        workspaceId: acme.id,
        userId: getUser("anusha@vaultspace.io").id,
        role: "member",
      },
      {
        workspaceId: acme.id,
        userId: getUser("kajal@vaultspace.io").id,
        role: "guest",
      },

      // Side Project Labs members (subset — tests multi-tenant isolation)
      {
        workspaceId: sideLabs.id,
        userId: getUser("tanish@vaultspace.io").id,
        role: "owner",
      },
      {
        workspaceId: sideLabs.id,
        userId: getUser("neha@vaultspace.io").id,
        role: "admin",
      },
      {
        workspaceId: sideLabs.id,
        userId: getUser("ashtam@vaultspace.io").id,
        role: "guest",
      },
    ])
    .returning()

  console.log(`✓ Created ${workspaceMembers.length} workspace memberships`)

  // ─── Teams ────────────────────────────────────────────────────
  const teams = await db
    .insert(TeamTable)
    .values([
      // Acme teams
      {
        workspaceId: acme.id,
        name: "Platform Team",
        description: "Core platform and infrastructure",
      },
      {
        workspaceId: acme.id,
        name: "Growth Team",
        description: "Marketing, analytics, and user acquisition",
      },
      {
        workspaceId: acme.id,
        name: "Design Team",
        description: "UI/UX design and brand",
      },

      // Side Project Labs teams
      {
        workspaceId: sideLabs.id,
        name: "Research Team",
        description: "Experimental projects and R&D",
      },
    ])
    .returning()

  console.log(`✓ Created ${teams.length} teams`)

  const getTeam = (name: string) => teams.find((t) => t.name === name)!

  const platformTeam = getTeam("Platform Team")
  const growthTeam = getTeam("Growth Team")
  const designTeam = getTeam("Design Team")
  const researchTeam = getTeam("Research Team")

  // ─── Team Members ─────────────────────────────────────────────
  const teamMembers = await db
    .insert(TeamMemberTable)
    .values([
      // Platform Team
      {
        teamId: platformTeam.id,
        userId: getUser("ashtam@vaultspace.io").id,
        role: "lead",
      },
      {
        teamId: platformTeam.id,
        userId: getUser("abhinav@vaultspace.io").id,
        role: "member",
      },
      {
        teamId: platformTeam.id,
        userId: getUser("kirtiman@vaultspace.io").id,
        role: "member",
      },

      // Growth Team
      {
        teamId: growthTeam.id,
        userId: getUser("tanish@vaultspace.io").id,
        role: "lead",
      },
      {
        teamId: growthTeam.id,
        userId: getUser("neha@vaultspace.io").id,
        role: "member",
      },
      {
        teamId: growthTeam.id,
        userId: getUser("anusha@vaultspace.io").id,
        role: "member",
      },

      // Design Team — cross-functional
      {
        teamId: designTeam.id,
        userId: getUser("nikunj@vaultspace.io").id,
        role: "lead",
      },
      {
        teamId: designTeam.id,
        userId: getUser("anusha@vaultspace.io").id,
        role: "member",
      },

      // Research Team (Side Project Labs)
      {
        teamId: researchTeam.id,
        userId: getUser("tanish@vaultspace.io").id,
        role: "lead",
      },
      {
        teamId: researchTeam.id,
        userId: getUser("neha@vaultspace.io").id,
        role: "member",
      },
    ])
    .returning()

  console.log(`✓ Created ${teamMembers.length} team memberships`)

  // ─── Projects ─────────────────────────────────────────────────
  const projects = await db
    .insert(ProjectTable)
    .values([
      // Acme — Platform Team projects
      {
        name: "API Documentation",
        description: "Technical documentation for our REST API",
        ownerId: getUser("ashtam@vaultspace.io").id,
        department: "Engineering",
        workspaceId: acme.id,
        teamId: platformTeam.id,
        visibility: "team",
      },
      {
        name: "System Architecture",
        description: "High-ltanishl system design documents",
        ownerId: getUser("ashtam@vaultspace.io").id,
        department: "Engineering",
        workspaceId: acme.id,
        teamId: platformTeam.id,
        visibility: "workspace",
      },

      // Acme — Growth Team projects
      {
        name: "Brand Guidelines",
        description: "Company branding and style guide",
        ownerId: getUser("tanish@vaultspace.io").id,
        department: "Marketing",
        workspaceId: acme.id,
        teamId: growthTeam.id,
        visibility: "workspace",
      },
      {
        name: "Campaign Plans",
        description: "Marketing campaign strategies and plans",
        ownerId: getUser("tanish@vaultspace.io").id,
        department: "Marketing",
        workspaceId: acme.id,
        teamId: growthTeam.id,
        visibility: "team",
      },

      // Acme — Cross-department (no team)
      {
        name: "Company Wiki",
        description: "General knowledge base for all departments",
        ownerId: getUser("ashtam@vaultspace.io").id,
        department: null,
        workspaceId: acme.id,
        teamId: null,
        visibility: "workspace",
      },

      // Side Project Labs
      {
        name: "Experimental Features",
        description: "Prototypes and proof-of-concept work",
        ownerId: getUser("tanish@vaultspace.io").id,
        department: "Engineering",
        workspaceId: sideLabs.id,
        teamId: researchTeam.id,
        visibility: "team",
      },
    ])
    .returning()

  console.log(`✓ Created ${projects.length} projects`)

  const getProject = (name: string) => projects.find((p) => p.name === name)!

  // ─── Documents ────────────────────────────────────────────────
  const documents = await db
    .insert(DocumentTable)
    .values([
      // API Documentation — various states for permission testing
      {
        title: "Getting Started Guide",
        content:
          "# Getting Started\n\nWelcome to the VaultSpace API. This guide walks you through authentication, making your first request, and understanding our rate limits.",
        status: "published",
        sensitivity: "public",
        isLocked: false,
        projectId: getProject("API Documentation").id,
        creatorId: getUser("abhinav@vaultspace.io").id,
        lastEditedById: getUser("kirtiman@vaultspace.io").id,
      },
      {
        title: "Authentication Flow",
        content:
          "# Authentication\n\nWork in progress — documenting OAuth2 flow and API key management.",
        status: "draft",
        sensitivity: "internal",
        isLocked: false,
        projectId: getProject("API Documentation").id,
        creatorId: getUser("abhinav@vaultspace.io").id,
        lastEditedById: getUser("abhinav@vaultspace.io").id,
      },
      {
        title: "API v1 Reference (Deprecated)",
        content:
          "# API v1\n\nDeprecated — use v2 instead. This document is kept for historical reference.",
        status: "archived",
        sensitivity: "internal",
        isLocked: true,
        projectId: getProject("API Documentation").id,
        creatorId: getUser("ashtam@vaultspace.io").id,
        lastEditedById: getUser("ashtam@vaultspace.io").id,
      },
      {
        title: "Security Incident Response",
        content:
          "# Security Response Plan\n\nClassified procedures for handling security incidents. Contains escalation contacts and response timelines.",
        status: "published",
        sensitivity: "restricted",
        isLocked: true,
        projectId: getProject("API Documentation").id,
        creatorId: getUser("ashtam@vaultspace.io").id,
        lastEditedById: getUser("ashtam@vaultspace.io").id,
      },

      // System Architecture
      {
        title: "Database Schema Design",
        content:
          "# Database Design\n\nOur PostgreSQL schema uses UUIDs as primary keys with cascading deletes for referential integrity.",
        status: "draft",
        sensitivity: "confidential",
        isLocked: false,
        projectId: getProject("System Architecture").id,
        creatorId: getUser("abhinav@vaultspace.io").id,
        lastEditedById: getUser("abhinav@vaultspace.io").id,
      },
      {
        title: "Microservices Overview",
        content:
          "# Microservices\n\nOur service architecture follows domain-driven design principles with tanishnt-driven communication.",
        status: "published",
        sensitivity: "internal",
        isLocked: false,
        projectId: getProject("System Architecture").id,
        creatorId: getUser("abhinav@vaultspace.io").id,
        lastEditedById: getUser("kirtiman@vaultspace.io").id,
      },

      // Brand Guidelines
      {
        title: "Logo Usage",
        content:
          "# Logo Guidelines\n\nThe VaultSpace logo must maintain minimum padding of 24px. Ntanishr stretch, rotate, or recolor the logo.",
        status: "published",
        sensitivity: "public",
        isLocked: false,
        projectId: getProject("Brand Guidelines").id,
        creatorId: getUser("neha@vaultspace.io").id,
        lastEditedById: getUser("anusha@vaultspace.io").id,
      },
      {
        title: "Color Palette",
        content:
          "# Colors\n\nPrimary: #6366F1 (Indigo)\nSecondary: #EC4899 (Pink)\nNeutral: #1E293B (Slate)",
        status: "published",
        sensitivity: "public",
        isLocked: true,
        projectId: getProject("Brand Guidelines").id,
        creatorId: getUser("tanish@vaultspace.io").id,
        lastEditedById: getUser("tanish@vaultspace.io").id,
      },
      {
        title: "Typography Guide",
        content:
          "# Typography\n\nHeadings: Inter (600, 700)\nBody: Inter (400)\nCode: JetBrains Mono (400)",
        status: "draft",
        sensitivity: "public",
        isLocked: false,
        projectId: getProject("Brand Guidelines").id,
        creatorId: getUser("neha@vaultspace.io").id,
        lastEditedById: getUser("neha@vaultspace.io").id,
      },

      // Campaign Plans
      {
        title: "Q1 2026 Campaign",
        content:
          "# Q1 Campaign\n\nTargeting dtanishloper communities with content marketing and conference sponsorships.",
        status: "published",
        sensitivity: "internal",
        isLocked: false,
        projectId: getProject("Campaign Plans").id,
        creatorId: getUser("neha@vaultspace.io").id,
        lastEditedById: getUser("anusha@vaultspace.io").id,
      },
      {
        title: "Competitor Analysis",
        content:
          "# Competitor Analysis\n\nDetailed analysis of Notion, Confluence, and Linear permissions models. Contains pricing intelligence.",
        status: "review",
        sensitivity: "confidential",
        isLocked: false,
        projectId: getProject("Campaign Plans").id,
        creatorId: getUser("tanish@vaultspace.io").id,
        lastEditedById: getUser("tanish@vaultspace.io").id,
      },
      {
        title: "Q4 2025 Retrospective",
        content:
          "# Q4 Results\n\nWhat went well: 40% increase in signups. What didn't: churn rate stayed flat.",
        status: "archived",
        sensitivity: "internal",
        isLocked: false,
        projectId: getProject("Campaign Plans").id,
        creatorId: getUser("tanish@vaultspace.io").id,
        lastEditedById: getUser("tanish@vaultspace.io").id,
      },

      // Company Wiki
      {
        title: "Company History",
        content:
          "# Our Story\n\nFounded in 2024 with a mission to make enterprise collaboration accessible to teams of all sizes.",
        status: "published",
        sensitivity: "public",
        isLocked: false,
        projectId: getProject("Company Wiki").id,
        creatorId: getUser("ashtam@vaultspace.io").id,
        lastEditedById: getUser("ashtam@vaultspace.io").id,
      },
      {
        title: "Employee Handbook",
        content:
          "# Employee Handbook\n\nPolicies, benefits, and procedures for all VaultSpace team members.",
        status: "published",
        sensitivity: "internal",
        isLocked: false,
        projectId: getProject("Company Wiki").id,
        creatorId: getUser("tanish@vaultspace.io").id,
        lastEditedById: getUser("anusha@vaultspace.io").id,
      },
      {
        title: "Board Meeting Notes",
        content:
          "# Board Meeting — June 2026\n\nFinancial projections, funding round details, and strategic pivots under consideration.",
        status: "draft",
        sensitivity: "restricted",
        isLocked: true,
        projectId: getProject("Company Wiki").id,
        creatorId: getUser("ashtam@vaultspace.io").id,
        lastEditedById: getUser("ashtam@vaultspace.io").id,
      },

      // Side Project Labs — Experimental Features
      {
        title: "AI Permission Suggestions",
        content:
          "# AI-Powered Permissions\n\nExploring ML models to suggest optimal permission configurations based on team structure.",
        status: "draft",
        sensitivity: "confidential",
        isLocked: false,
        projectId: getProject("Experimental Features").id,
        creatorId: getUser("tanish@vaultspace.io").id,
        lastEditedById: getUser("tanish@vaultspace.io").id,
      },
    ])
    .returning()

  console.log(`✓ Created ${documents.length} documents`)

  // ─── Summary ──────────────────────────────────────────────────
  console.log("\n📊 Seed Summary:")
  console.log(`   - Users: ${users.length}`)
  console.log(`   - Workspaces: ${workspaces.length}`)
  console.log(`   - Workspace Members: ${workspaceMembers.length}`)
  console.log(`   - Teams: ${teams.length}`)
  console.log(`   - Team Members: ${teamMembers.length}`)
  console.log(`   - Projects: ${projects.length}`)
  console.log(`   - Documents: ${documents.length}`)
  console.log("\n🔑 Key conflict scenarios seeded:")
  console.log("   - Ashtam: OWNER in Acme, GUEST in Side Project Labs")
  console.log("   - Tanish: OWNER in Side Project Labs, ADMIN in Acme")
  console.log("   - Kajal: GUEST in Acme (not in Side Project Labs)")
  console.log(
    '   - Documents with sensitivity: public → restricted across projects',
  )
  console.log("   - Locked + archived documents for deny-rule testing")
  console.log("\n✅ Database seeded successfully!")
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
