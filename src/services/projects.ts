import {
  createProject,
  deleteProject,
  updateProject,
} from "@/dal/projects/mutations"
import { getAllProjects, getProjectById } from "@/dal/projects/queries"
import { ProjectTable } from "@/drizzle/schema"
import { AuthorizationError, AuthenticationError, NotFoundError } from "@/lib/errors"
import { getCurrentUser } from "@/lib/session"
import { getUserWorkspacePermissions, toDrizzleWhere } from "@/permissions/casl"
import { ProjectFormValues, projectSchema } from "@/schemas/projects"
import { subject } from "@casl/ability"
import { logAction } from "./audit"
import { and, eq } from "drizzle-orm"

export async function createProjectService(workspaceId: string, data: ProjectFormValues) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const result = projectSchema.safeParse(data)
  if (!result.success) throw new Error("Invalid data")

  const newProject = {
    ...result.data,
    ownerId: user.id,
    workspaceId,
    department: result.data.department || null,
  }

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("create", subject("project", { ...newProject } as any))) {
    throw new AuthorizationError()
  }

  const project = await createProject(newProject)

  await logAction(user.id, workspaceId, "create", "project", project.id, {
    name: project.name,
  })

  return project
}

export async function updateProjectService(
  workspaceId: string,
  projectId: string,
  data: ProjectFormValues,
) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const project = await getProjectById(projectId)
  if (project == null || project.workspaceId !== workspaceId) throw new NotFoundError("Not found")

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("update", subject("project", { ...project }))) {
    throw new AuthorizationError()
  }

  const result = projectSchema.safeParse(data)
  if (!result.success) throw new Error("Invalid data")

  await updateProject(projectId, result.data)

  await logAction(user.id, workspaceId, "update", "project", projectId, result.data)

  return getProjectById(projectId)
}

export async function deleteProjectService(workspaceId: string, projectId: string) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  const project = await getProjectById(projectId)
  if (project == null || project.workspaceId !== workspaceId) throw new NotFoundError("Not found")

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("delete", subject("project", { ...project }))) {
    throw new AuthorizationError()
  }

  await deleteProject(projectId)

  await logAction(user.id, workspaceId, "delete", "project", projectId, {
    name: project.name,
  })
}

export async function getAllProjectsService(workspaceId: string, { ordered } = { ordered: false }) {
  const user = await getCurrentUser()
  if (user == null) throw new AuthenticationError()

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("read", "project")) {
    return []
  }

  // Get CASL AST converted to drizzle where clause
  const caslWhere = await toDrizzleWhere(workspaceId, "read", "project", ProjectTable)
  
  // Combine it with the workspace isolation filter
  const finalWhere = caslWhere 
    ? and(eq(ProjectTable.workspaceId, workspaceId), caslWhere)
    : eq(ProjectTable.workspaceId, workspaceId)

  return getAllProjects(
    { ordered },
    finalWhere,
  )
}

export async function getProjectByIdService(workspaceId: string, id: string) {
  const project = await getProjectById(id)
  if (project == null || project.workspaceId !== workspaceId) return null

  // PERMISSION:
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (!permissions.can("read", subject("project", { ...project }))) {
    throw new AuthorizationError()
  }

  return project
}
