import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, LockIcon, FileTextIcon } from "lucide-react"
import { getStatusBadgeVariant } from "@/lib/helpers"
import { getProjectDocumentsService } from "@/services/document"
import { getProjectByIdService } from "@/services/projects"
import { getUserWorkspacePermissions } from "@/permissions/casl"
import { getWorkspaceBySlugService } from "@/services/workspace"
import { subject } from "@casl/ability"
import { SensitivityBadge } from "@/components/sensitivity-badge"

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  
  const workspace = await getWorkspaceBySlugService(workspaceSlug)
  if (!workspace) return redirect("/workspaces")

  const project = await getProjectByIdService(workspace.id, projectId)
  if (project == null) return notFound()

  const permissions = await getUserWorkspacePermissions(workspace.id)
  const documents = await getProjectDocumentsService(workspace.id, projectId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex gap-2 items-center">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline" className="text-xs">
              {project.visibility}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {/* PERMISSION: */}

          {permissions.can("update", subject("project", { ...project })) && (
            <Button asChild variant="outline">
              <Link href={`/${workspaceSlug}/projects/${projectId}/edit`}>Edit Project</Link>
            </Button>
          )}
          {/* PERMISSION: */}
          {permissions.can("create", "document") && (
            <Button asChild>
              <Link href={`/${workspaceSlug}/projects/${projectId}/documents/new`}>
                <PlusIcon className="size-4" />
                New Document
              </Link>
            </Button>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileTextIcon className="size-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">No Documents</h2>
            <p className="text-muted-foreground mb-4">
              Create your first document in this project.
            </p>
            {/* PERMISSION: */}
            {permissions.can("create", "document") && (
              <Button asChild>
                <Link href={`/${workspaceSlug}/projects/${projectId}/documents/new`}>
                  <PlusIcon className="size-4 mr-2" />
                  New Document
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => (
            <Link
              key={doc.id}
              href={`/${workspaceSlug}/projects/${projectId}/documents/${doc.id}`}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="gap-1.5">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    {doc.isLocked && (
                      <LockIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>{doc.creator.name}</CardDescription>
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                    <SensitivityBadge sensitivity={doc.sensitivity} />
                    {doc.isLocked && <Badge variant="outline">locked</Badge>}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
