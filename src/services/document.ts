import {
  createDocument,
  deleteDocument,
  updateDocument,
} from "@/dal/documents/mutations"
import {
  getDocumentById,
  getDocumentWithUserInfo,
  getProjectDocuments,
} from "@/dal/documents/queries"
import { DocumentTable } from "@/drizzle/schema"
import { AuthorizationError, AuthenticationError, NotFoundError } from "@/lib/errors"
import { getCurrentUser } from "@/lib/session"
import {
  getUserWorkspacePermissions,
  pickPermittedFields,
  toDrizzleWhere,
} from "@/permissions/casl"
import { DocumentFormValues, documentSchema } from "@/schemas/documents"
import { subject } from "@casl/ability"
import { logAction } from "./audit"
import { getProjectById } from "@/dal/projects/queries"
import { and, eq } from "drizzle-orm"

export async function createDocumentService(
  workspaceId: string,
  projectId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const project = await getProjectById(projectId)
  if (!project || project.workspaceId !== workspaceId) {
    throw new NotFoundError("Project not found")
  }

  const permissions = await getUserWorkspacePermissions(workspaceId)
  const restrictedData = await pickPermittedFields(workspaceId, "create", "document", data)

  const result = documentSchema.safeParse(restrictedData)
  if (!result.success) throw new Error("Invalid data")

  const newDocument = {
    ...result.data,
    projectId,
    creatorId: user.id,
    lastEditedById: user.id,
    status: result.data.status ?? "draft",
    sensitivity: result.data.sensitivity ?? "public",
    isLocked: result.data.isLocked ?? false,
  }

  // PERMISSION:
  if (!permissions.can("create", subject("document", { ...newDocument } as any))) {
    throw new AuthorizationError()
  }

  const document = await createDocument(newDocument)

  await logAction(user.id, workspaceId, "create", "document", document.id, {
    title: document.title,
    projectId,
  })

  return document
}

export async function updateDocumentService(
  workspaceId: string,
  documentId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const document = await getDocumentById(documentId)
  if (document == null) throw new NotFoundError("Not found")

  const project = await getProjectById(document.projectId)
  if (!project || project.workspaceId !== workspaceId) {
    throw new NotFoundError("Not found")
  }

  const permissions = await getUserWorkspacePermissions(workspaceId)
  const restrictedData = await pickPermittedFields(
    workspaceId,
    "update",
    subject("document", { ...document }),
    data,
  )

  // PERMISSION:
  if (!permissions.can("update", subject("document", { ...document }))) {
    throw new AuthorizationError()
  }

  const result = documentSchema.safeParse(restrictedData)
  if (!result.success) throw new Error("Invalid data")

  await updateDocument(documentId, {
    ...result.data,
    lastEditedById: user.id,
  })

  await logAction(user.id, workspaceId, "update", "document", documentId, {
    updatedFields: Object.keys(result.data),
  })

  return getDocumentById(documentId)
}

export async function deleteDocumentService(workspaceId: string, documentId: string) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const document = await getDocumentById(documentId)
  if (document == null) throw new NotFoundError("Not found")
  
  const project = await getProjectById(document.projectId)
  if (!project || project.workspaceId !== workspaceId) {
    throw new NotFoundError("Not found")
  }

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("delete", subject("document", { ...document }))) {
    throw new AuthorizationError()
  }

  await deleteDocument(documentId)

  await logAction(user.id, workspaceId, "delete", "document", documentId, {
    title: document.title,
  })
}

export async function getDocumentByIdService(workspaceId: string, id: string) {
  const document = await getDocumentById(id)
  if (document == null) return null

  const project = await getProjectById(document.projectId)
  if (!project || project.workspaceId !== workspaceId) return null

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("read", subject("document", { ...document }))) {
    throw new AuthorizationError()
  }

  return document
}

export async function getProjectDocumentsService(workspaceId: string, projectId: string) {
  const project = await getProjectById(projectId)
  if (!project || project.workspaceId !== workspaceId) return []

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("read", "document")) {
    return []
  }

  const caslWhere = await toDrizzleWhere(workspaceId, "read", "document", DocumentTable)
  
  return getProjectDocuments(
    projectId,
    caslWhere,
  )
}

export async function getDocumentWithUserInfoService(workspaceId: string, id: string) {
  const document = await getDocumentWithUserInfo(id)
  if (document == null) return null

  const project = await getProjectById(document.projectId)
  if (!project || project.workspaceId !== workspaceId) return null

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("read", subject("document", { ...document }))) {
    throw new AuthorizationError()
  }

  return document
}
