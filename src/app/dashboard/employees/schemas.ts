import { z } from "zod";

// Schema for employee creation
export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  employmentDate: z.string().refine(async (date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date.",
  }),
  basicSalary: z.coerce.number().positive("Salary must be a positive number.").min(1, "Salary is required."),
  isActive: z.boolean().default(true),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

// Schema for employee update
export const updateEmployeeSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  employmentDate: z.string().refine(async (date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date.",
  }),
  basicSalary: z.coerce.number().positive("Salary must be a positive number.").min(1, "Salary is required."),
  isActive: z.boolean().default(true),
});

export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
