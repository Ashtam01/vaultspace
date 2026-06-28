import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { ActionButton } from "@/components/ui/action-button"
import { deleteProjectAction } from "@/actions/projects"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProjectForm } from "@/components/project-form"
import { getProjectByIdService } from "@/services/projects"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { subject } from "@casl/ability"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  
  const workspace = await getWorkspaceBySlugService(workspaceSlug)
  if (!workspace) return redirect("/workspaces")

  const project = await getProjectByIdService(workspace.id, projectId)
  if (project == null) return notFound()

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspace.id)
  if (!permissions.can("update", subject("project", { ...project }))) {
    return redirect(`/${workspaceSlug}/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${workspaceSlug}/projects/${projectId}`}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Back to project</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <ProjectForm workspaceSlug={workspaceSlug} project={project} />

        {/* PERMISSION: */}
        {permissions.can("delete", subject("project", { ...project })) && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this project and all its documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionButton
                variant="destructive"
                requireAreYouSure
                action={deleteProjectAction.bind(null, workspaceSlug, projectId)}
              >
                Delete Project
              </ActionButton>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
