"use server"

import { redirect } from "next/navigation"
import { type DocumentFormValues } from "../schemas/documents"
import { tryFn } from "@/lib/helpers"
import {
  createDocumentService,
  deleteDocumentService,
  updateDocumentService,
} from "@/services/document"
import { getWorkspaceBySlug } from "@/dal/workspaces/queries"

export async function createDocumentAction(
  workspaceSlug: string,
  projectId: string,
  data: DocumentFormValues,
) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }

  const [error, document] = await tryFn(() =>
    createDocumentService(workspace.id, projectId, data),
  )

  if (error) return error

  redirect(`/${workspaceSlug}/projects/${projectId}/documents/${document.id}`)
}

export async function updateDocumentAction(
  workspaceSlug: string,
  documentId: string,
  projectId: string,
  data: DocumentFormValues,
) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }

  const [error] = await tryFn(() => updateDocumentService(workspace.id, documentId, data))

  if (error) return error

  redirect(`/${workspaceSlug}/projects/${projectId}/documents/${documentId}`)
}

export async function deleteDocumentAction(
  workspaceSlug: string,
  documentId: string,
  projectId: string,
) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }

  const [error] = await tryFn(() => deleteDocumentService(workspace.id, documentId))

  if (error) return error

  redirect(`/${workspaceSlug}/projects/${projectId}`)
}
