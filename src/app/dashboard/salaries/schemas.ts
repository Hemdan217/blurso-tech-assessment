import { z } from "zod";

// Define the change item schema
export const salaryChangeSchema = z.object({
  id: z.string().optional(), // For existing changes during edit
  value: z.coerce.number().refine((value) => value !== 0, {
    message: "Value cannot be zero",
  }),
  type: z.enum(["BONUS", "DEDUCTION"]),
  note: z.string().min(1, "Note is required").max(100, "Note is too long"),
});

export type SalaryChange = z.infer<typeof salaryChangeSchema>;

// Schema for creating a new salary
export const createSalarySchema = z
  .object({
    employeeId: z.string().min(1, "Employee is required"),
    month: z.string().refine(
      (date) => {
        try {
          // Ensure it's a valid date in YYYY-MM format
          const [year, month] = date.split("-").map(Number);
          if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return false;
          }
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid month format. Use YYYY-MM" },
    ),
    baseSalary: z.coerce.number().positive("Base salary must be positive"),
    changes: z.array(salaryChangeSchema).default([]),
    payable: z.coerce.number(),
    isPaid: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.changes.length > 0) {
        return data.changes.every(
          (change) =>
            (change.type === "BONUS" && change.value > 0) || (change.type === "DEDUCTION" && change.value < 0),
        );
      }
      return true;
    },
    {
      message: "BONUS values must be positive, DEDUCTION values must be negative",
      path: ["changes"],
    },
  );

export type CreateSalaryFormData = z.infer<typeof createSalarySchema>;

// Schema for updating an existing salary
export const updateSalarySchema = z
  .object({
    id: z.string(),
    baseSalary: z.coerce.number().positive("Base salary must be positive"),
    changes: z.array(salaryChangeSchema).default([]),
    payable: z.coerce.number(),
    isPaid: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.changes.length > 0) {
        return data.changes.every(
          (change) =>
            (change.type === "BONUS" && change.value > 0) || (change.type === "DEDUCTION" && change.value < 0),
        );
      }
      return true;
    },
    {
      message: "BONUS values must be positive, DEDUCTION values must be negative",
      path: ["changes"],
    },
  );

export type UpdateSalaryFormData = z.infer<typeof updateSalarySchema>;

// Schema for generating monthly salaries
export const generateMonthlySalariesSchema = z.object({
  month: z.string().refine(
    (date) => {
      try {
        // Ensure it's a valid date in YYYY-MM format
        const [year, month] = date.split("-").map(Number);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid month format. Use YYYY-MM" },
  ),
});

export type GenerateMonthlySalariesData = z.infer<typeof generateMonthlySalariesSchema>;

// Helper function to calculate payable amount from base salary and changes
export function calculatePayable(baseSalary: number, changes: SalaryChange[]): number {
  const totalChanges = changes.reduce((total, change) => total + change.value, 0);
  return baseSalary + totalChanges;
}
