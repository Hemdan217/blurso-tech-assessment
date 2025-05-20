import { z } from "zod";

// Schema for creating a new project
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

// Schema for updating an existing project
export const updateProjectSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

// Schema for toggling project archive status
export const toggleProjectArchiveSchema = z.object({
  id: z.string(),
  isArchived: z.boolean(),
});

// Schema for deleting a project
export const deleteProjectSchema = z.object({
  id: z.string(),
});

// Types based on schemas
export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type ToggleProjectArchiveData = z.infer<typeof toggleProjectArchiveSchema>;
export type DeleteProjectData = z.infer<typeof deleteProjectSchema>;
