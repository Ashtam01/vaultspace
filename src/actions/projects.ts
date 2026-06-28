"use server"

import { redirect } from "next/navigation"
import { type ProjectFormValues } from "../schemas/projects"
import { tryFn } from "@/lib/helpers"
import { revalidatePath } from "next/cache"
import {
  createProjectService,
  deleteProjectService,
  updateProjectService,
} from "@/services/projects"
import { getWorkspaceBySlug } from "@/dal/workspaces/queries"

export async function createProjectAction(workspaceSlug: string, data: ProjectFormValues) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }
  
  const [error, project] = await tryFn(() => createProjectService(workspace.id, data))
  if (error) return error

  revalidatePath(`/${workspaceSlug}/projects/${project.id}`)
  return redirect(`/${workspaceSlug}/projects/${project.id}`)
}

export async function updateProjectAction(
  workspaceSlug: string,
  projectId: string,
  data: ProjectFormValues,
) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }

  const [error] = await tryFn(() => updateProjectService(workspace.id, projectId, data))
  if (error) return error

  revalidatePath(`/${workspaceSlug}/projects/${projectId}`)
  return redirect(`/${workspaceSlug}/projects/${projectId}`)
}

export async function deleteProjectAction(workspaceSlug: string, projectId: string) {
  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) return { message: "Workspace not found" }

  const [error] = await tryFn(() => deleteProjectService(workspace.id, projectId))
  if (error) return error

  revalidatePath(`/${workspaceSlug}/projects`)
  redirect(`/${workspaceSlug}/projects`)
}
