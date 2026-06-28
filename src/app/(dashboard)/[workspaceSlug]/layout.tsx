import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { LogOutIcon } from "lucide-react"
import { logout } from "@/actions/auth"
import { ActionButton } from "@/components/ui/action-button"
import { getRoleBadgeVariant } from "@/lib/helpers"
import { getAllProjectsService } from "@/services/projects"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { getUserWorkspaces } from "@/dal/workspaces/queries"
import { ReactNode } from "react"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  
  const user = await getCurrentUser()
  if (user == null) redirect("/")

  try {
    const activeWorkspace = await getWorkspaceBySlugService(workspaceSlug)
    
    // Get all user workspaces for the switcher
    const userWorkspaceData = await getUserWorkspaces(user.id)
    const userWorkspaces = userWorkspaceData.map(w => w.workspace)

    const projects = await getAllProjectsService(activeWorkspace.id, { ordered: true })
    
    // PERMISSION:
    const permissions = await getUserWorkspacePermissions(activeWorkspace.id)

    // Find the user's role in the current workspace for the header
    const currentWorkspaceRole = userWorkspaceData.find(
      w => w.workspace.id === activeWorkspace.id
    )?.role

    return (
      <SidebarProvider>
        <AppSidebar
          activeWorkspace={activeWorkspace}
          userWorkspaces={userWorkspaces}
          projects={projects}
          canCreateProject={permissions.can("create", "project")}
          canManageSettings={permissions.can("manage_settings", "workspace")}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="md:-ml-1" />
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{user.name}</span>
                  {currentWorkspaceRole && (
                    <Badge variant={currentWorkspaceRole === "owner" || currentWorkspaceRole === "admin" ? "default" : "secondary"}>
                      {currentWorkspaceRole}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.department}
                </span>
              </div>
              <Separator orientation="vertical" />
              <ActionButton action={logout} variant="ghost" type="submit">
                <LogOutIcon className="size-4" />
                <span className="sr-only">Logout</span>
              </ActionButton>
            </div>
          </header>
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    )
  } catch (error) {
    console.error(error)
    return notFound()
  }
}
