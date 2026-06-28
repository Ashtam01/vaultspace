import { getCurrentUser } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { getWorkspaceTeams, getTeamMembers } from "@/dal/teams/queries"
import { getWorkspaceMembers } from "@/dal/workspaces/queries"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Shield } from "lucide-react"

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/")

  let workspace
  try {
    workspace = await getWorkspaceBySlugService(workspaceSlug)
  } catch {
    return notFound()
  }

  const permissions = await getUserWorkspacePermissions(workspace.id)
  const teams = await getWorkspaceTeams(workspace.id)
  const members = await getWorkspaceMembers(workspace.id)

  // Fetch members for each team
  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => {
      const teamMembers = await getTeamMembers(team.id)
      return { ...team, members: teamMembers }
    }),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Teams & Members</h1>
        <p className="text-muted-foreground">
          Manage teams and view workspace membership
        </p>
      </div>

      {/* Workspace Members */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="size-5" />
          Workspace Members ({members.length})
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.userId} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                <Badge
                  variant={
                    member.role === "owner" || member.role === "admin"
                      ? "default"
                      : member.role === "guest"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {member.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="size-5" />
          Teams ({teams.length})
        </h2>
        {teamsWithMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Teams Yet</h3>
              <p className="text-muted-foreground">
                Teams help organize members and control project access.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teamsWithMembers.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{m.user.name}</span>
                        <Badge variant={m.role === "lead" ? "default" : "outline"} className="text-xs">
                          {m.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
