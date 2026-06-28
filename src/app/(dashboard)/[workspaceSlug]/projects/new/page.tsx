import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { ProjectForm } from "@/components/project-form"
import { redirect } from "next/navigation"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const workspace = await getWorkspaceBySlugService(workspaceSlug)
  if (!workspace) return redirect("/workspaces")

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspace.id)
  if (!permissions.can("create", "project")) {
    return redirect(`/${workspaceSlug}/projects`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${workspaceSlug}/projects`}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Back to projects</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-muted-foreground">Create a new project</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ProjectForm workspaceSlug={workspaceSlug} />
      </div>
    </div>
  )
}
