import { getCurrentUser } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"

export default async function SettingsPage({
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="size-6" />
          Workspace Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your workspace configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic workspace information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name</span>
              <p className="font-medium">{workspace.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Slug</span>
              <p className="font-medium">{workspace.slug}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ID</span>
              <p className="font-mono text-xs">{workspace.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium">
                {workspace.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Model</CardTitle>
          <CardDescription>
            How access control works in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge>RBAC</Badge>
              <span>Role-Based: Owner → Admin → Member → Guest</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">ABAC</Badge>
              <span>
                Attribute-Based: Document sensitivity, status, locked state
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">ReBAC</Badge>
              <span>
                Relationship-Based: Team → Project → Document access chains
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
