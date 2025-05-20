"use server";

import { revalidatePath } from "next/cache";
import { format, parse } from "date-fns";
import { prisma } from "@/lib/prisma";
import { CreateSalaryFormData, UpdateSalaryFormData, GenerateMonthlySalariesData, calculatePayable } from "./schemas";

export type SalaryFilter = {
  employeeId?: string;
  month?: string;
};

// Create a new salary
export async function createSalary(data: CreateSalaryFormData) {
  try {
    const { employeeId, month, baseSalary, changes, isPaid } = data;

    // Convert month string (YYYY-MM) to Date (YYYY-MM-01)
    const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());

    // Calculate payable amount
    const payable = calculatePayable(baseSalary, changes);

    // Check if a salary record already exists for this employee and month
    const existingSalary = await prisma.salary.findFirst({
      where: {
        employeeId,
        month: monthDate,
      },
    });

    if (existingSalary) {
      return {
        success: false,
        message: `A salary record already exists for this employee in ${format(monthDate, "MMMM yyyy")}`,
      };
    }

    // Create the salary record
    await prisma.salary.create({
      data: {
        employeeId,
        month: monthDate,
        baseSalary,
        payable,
        changes: changes.map((change) => ({
          value: change.value,
          type: change.type,
          note: change.note,
        })),
        isPaid,
      },
    });

    revalidatePath("/dashboard/salaries");
    return { success: true, message: "Salary created successfully" };
  } catch (error) {
    console.error("Error creating salary:", error);
    return { success: false, message: "Failed to create salary" };
  }
}

// Update an existing salary
export async function updateSalary(data: UpdateSalaryFormData) {
  try {
    const { id, baseSalary, changes, isPaid } = data;

    // Find the salary record to update
    const existingSalary = await prisma.salary.findUnique({
      where: { id },
    });

    if (!existingSalary) {
      return { success: false, message: "Salary record not found" };
    }

    // Check if the salary is already paid
    if (existingSalary.isPaid && !isPaid) {
      return { success: false, message: "Cannot modify a paid salary record" };
    }

    // Calculate payable amount
    const payable = calculatePayable(baseSalary, changes);

    // Update the salary record
    await prisma.salary.update({
      where: { id },
      data: {
        baseSalary,
        payable,
        changes: changes.map((change) => ({
          value: change.value,
          type: change.type,
          note: change.note,
        })),
        isPaid,
      },
    });

    revalidatePath("/dashboard/salaries");
    return { success: true, message: "Salary updated successfully" };
  } catch (error) {
    console.error("Error updating salary:", error);
    return { success: false, message: "Failed to update salary" };
  }
}

// Delete a salary record
export async function deleteSalary(id: string) {
  try {
    // Find the salary record to delete
    const existingSalary = await prisma.salary.findUnique({
      where: { id },
    });

    if (!existingSalary) {
      return { success: false, message: "Salary record not found" };
    }

    // Check if the salary is already paid
    if (existingSalary.isPaid) {
      return { success: false, message: "Cannot delete a paid salary record" };
    }

    // Delete the salary record
    await prisma.salary.delete({
      where: { id },
    });

    revalidatePath("/dashboard/salaries");
    return { success: true, message: "Salary deleted successfully" };
  } catch (error) {
    console.error("Error deleting salary:", error);
    return { success: false, message: "Failed to delete salary" };
  }
}

// Generate monthly salaries for all active employees
export async function generateMonthlySalaries(data: GenerateMonthlySalariesData) {
  try {
    const { month } = data;

    // Convert month string (YYYY-MM) to Date (YYYY-MM-01)
    const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());

    // Get all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
      },
    });

    if (activeEmployees.length === 0) {
      return { success: false, message: "No active employees found" };
    }

    // Generate salary records for each employee
    let created = 0;
    let skipped = 0;

    for (const employee of activeEmployees) {
      // Check if a salary record already exists for this employee and month
      const existingSalary = await prisma.salary.findFirst({
        where: {
          employeeId: employee.id,
          month: monthDate,
        },
      });

      if (existingSalary) {
        skipped++;
        continue;
      }

      // Create the salary record with default values
      await prisma.salary.create({
        data: {
          employeeId: employee.id,
          month: monthDate,
          baseSalary: employee.basicSalary,
          payable: employee.basicSalary, // No changes initially
          changes: [], // No changes initially
          isPaid: false,
        },
      });

      created++;
    }

    revalidatePath("/dashboard/salaries");
    return {
      success: true,
      message: `Generated ${created} salary records (Skipped ${skipped} existing records)`,
    };
  } catch (error) {
    console.error("Error generating monthly salaries:", error);
    return { success: false, message: "Failed to generate monthly salaries" };
  }
}

// Get paginated salaries with optional filtering
export async function getPaginatedSalaries(page: number = 1, limit: number = 10, filters: SalaryFilter = {}) {
  try {
    const skip = (page - 1) * limit;
    const { employeeId, month } = filters;

    // Build the where clause based on filters
    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (month) {
      // Convert month string (YYYY-MM) to Date range
      const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      where.month = {
        gte: monthDate,
        lt: nextMonth,
      };
    }

    // Get paginated salaries with total count
    const [salaries, totalCount] = await Promise.all([
      prisma.salary.findMany({
        skip,
        take: limit,
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      }),
      prisma.salary.count({ where }),
    ]);

    return {
      salaries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching paginated salaries:", error);
    throw error;
  }
}

// Get paginated salaries for a specific employee (used in my-salaries page)
export async function getEmployeeSalaries(employeeId: string, page: number = 1, limit: number = 10, month?: string) {
  try {
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = { employeeId };

    if (month) {
      // Convert month string (YYYY-MM) to Date range
      const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      where.month = {
        gte: monthDate,
        lt: nextMonth,
      };
    }

    // Get paginated salaries with total count
    const [salaries, totalCount] = await Promise.all([
      prisma.salary.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      }),
      prisma.salary.count({ where }),
    ]);

    return {
      salaries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching employee salaries:", error);
    throw error;
  }
}
