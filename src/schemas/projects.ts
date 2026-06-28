import { z } from "zod"
import { projectVisibilities } from "@/drizzle/schema/project"

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  department: z.string(),
  visibility: z.enum(projectVisibilities).optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
