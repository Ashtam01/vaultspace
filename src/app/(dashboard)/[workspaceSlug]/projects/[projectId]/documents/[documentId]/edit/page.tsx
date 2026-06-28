import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { DocumentForm } from "@/components/document-form"
import { getDocumentByIdService } from "@/services/document"
import { getProjectByIdService } from "@/services/projects"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { subject } from "@casl/ability"

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; documentId: string }>
}) {
  const { workspaceSlug, projectId, documentId } = await params
  
  const workspace = await getWorkspaceBySlugService(workspaceSlug)
  if (!workspace) return redirect("/workspaces")

  const document = await getDocumentByIdService(workspace.id, documentId)
  if (document == null) return notFound()

  const project = await getProjectByIdService(workspace.id, projectId)
  if (project == null) return notFound()

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspace.id)
  if (!permissions.can("update", subject("document", { ...document }))) {
    return redirect(`/${workspaceSlug}/projects/${projectId}/documents/${documentId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${workspaceSlug}/projects/${projectId}/documents/${documentId}`}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Back to document</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Document</h1>
          <p className="text-muted-foreground">in {project.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DocumentForm
          workspaceSlug={workspaceSlug}
          document={document}
          projectId={projectId}
          canModify={{
            isLocked: permissions.can(
              "update",
              subject("document", { ...document }),
              "isLocked",
            ),
            status: permissions.can(
              "update",
              subject("document", { ...document }),
              "status",
            ),
          }}
        />
      </div>
    </div>
  )
}
