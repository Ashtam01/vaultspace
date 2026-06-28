import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { DocumentForm } from "@/components/document-form"
import { getProjectByIdService } from "@/services/projects"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"

export default async function NewDocumentPage({
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
  if (!permissions.can("create", "document")) {
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
          <h1 className="text-2xl font-bold">New Document</h1>
          <p className="text-muted-foreground">in {project.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DocumentForm
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          canModify={{
            isLocked: permissions.can("update", "document", "isLocked"),
            status: permissions.can("update", "document", "status"),
          }}
        />
      </div>
    </div>
  )
}
