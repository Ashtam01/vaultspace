import { getAllProjectsService } from "@/services/projects"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { redirect } from "next/navigation"

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const workspace = await getWorkspaceBySlugService(workspaceSlug)
  if (!workspace) return redirect("/workspaces")

  const projects = await getAllProjectsService(workspace.id)

  if (projects.length > 0) {
    redirect(`/${workspaceSlug}/projects/${projects[0].id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold">No Projects</h1>
      <p className="text-muted-foreground">Create a project to get started.</p>
    </div>
  )
}
