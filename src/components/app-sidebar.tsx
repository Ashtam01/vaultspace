"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderIcon, PlusIcon, Users, Settings, Activity } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Project, Workspace } from "@/drizzle/schema"
import { WorkspaceSwitcher } from "./workspace-switcher"

type AppSidebarProps = {
  activeWorkspace: Workspace
  userWorkspaces: Workspace[]
  projects: Pick<Project, "id" | "name" | "department" | "visibility">[]
  canCreateProject: boolean
  canManageSettings: boolean
}

export function AppSidebar({
  activeWorkspace,
  userWorkspaces,
  projects,
  canCreateProject,
  canManageSettings,
}: AppSidebarProps) {
  const pathname = usePathname()
  const basePath = `/${activeWorkspace.slug}`

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceSwitcher
              workspaces={userWorkspaces}
              activeWorkspace={activeWorkspace}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Projects Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            Projects
            {canCreateProject && (
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`${basePath}/projects/new`}>
                  <PlusIcon className="size-4" />
                  <span className="sr-only">New Project</span>
                </Link>
              </Button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => {
                const isActive = pathname.startsWith(
                  `${basePath}/projects/${project.id}`,
                )
                return (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-auto"
                    >
                      <Link
                        href={`${basePath}/projects/${project.id}`}
                        className="flex items-start gap-2"
                      >
                        <FolderIcon className="size-4 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <span>{project.name}</span>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {project.visibility}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Teams - Visible to everyone */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes("/teams")}>
                  <Link href={`${basePath}/teams`}>
                    <Users className="size-4" />
                    <span>Teams & Members</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Settings - Requires manage_settings */}
              {canManageSettings && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/settings")}>
                      <Link href={`${basePath}/settings`}>
                        <Settings className="size-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/audit-log")}>
                      <Link href={`${basePath}/audit-log`}>
                        <Activity className="size-4" />
                        <span>Audit Log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
