import { z } from "zod";

// Schema for creating a new task
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(100, "Task title cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  assignedToId: z.string({
    required_error: "Please select an employee",
  }),
  projectId: z.string(),
});

// Schema for updating a task
export const updateTaskSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(100, "Task title cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// Schema for updating task status
export const updateTaskStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  note: z.string().optional(),
});

// Schema for adding a note to a task
export const addTaskNoteSchema = z.object({
  id: z.string(),
  note: z.string().min(1, "Note cannot be empty"),
});

// Schema for deleting a task
export const deleteTaskSchema = z.object({
  id: z.string(),
});

// Types based on schemas
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusData = z.infer<typeof updateTaskStatusSchema>;
export type AddTaskNoteData = z.infer<typeof addTaskNoteSchema>;
export type DeleteTaskData = z.infer<typeof deleteTaskSchema>;
