import { getCurrentUser } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceAuditLogs } from "@/dal/audit-logs/queries"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

function getActionBadgeVariant(action: string) {
  switch (action) {
    case "create":
      return "default" as const
    case "update":
      return "secondary" as const
    case "delete":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

export default async function AuditLogPage({
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
  if (permissions.cannot("manage_settings", "workspace")) {
    redirect(`/${workspaceSlug}/projects`)
  }

  const logs = await getWorkspaceAuditLogs(workspace.id, 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="size-6" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">
          Track all actions performed in this workspace
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="size-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">No Activity Yet</h2>
            <p className="text-muted-foreground">
              Actions will appear here as users interact with the workspace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{log.user.name}</span>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline">{log.resourceType}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.resourceId}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.performedAt.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
