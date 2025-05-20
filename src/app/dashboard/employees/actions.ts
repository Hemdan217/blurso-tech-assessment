"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CreateEmployeeFormData, UpdateEmployeeFormData } from "./schemas";

// Generate a unique 6-digit employee ID
export async function generateEmployeeId(): Promise<string> {
  while (true) {
    // Generate a random 6-digit number
    const employeeId = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if it already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!existingEmployee) {
      return employeeId;
    }
  }
}

// Create new employee
export async function createEmployee(formData: CreateEmployeeFormData) {
  try {
    const { name, email, password, employmentDate, basicSalary, isActive } = formData;

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Generate employee ID
    const employeeId = await generateEmployeeId();

    // Create the user with EMPLOYEE role
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        employee: {
          create: {
            employeeId,
            employmentDate: new Date(employmentDate),
            basicSalary,
            isActive,
          },
        },
      },
    });

    revalidatePath("/dashboard/employees");
    return { success: true, message: "Employee created successfully." };
  } catch (error) {
    console.error("Error creating employee:", error);

    if (error.code === "P2002") {
      return { success: false, message: "Email already exists." };
    }

    return { success: false, message: "Failed to create employee." };
  }
}

// Update existing employee
export async function updateEmployee(formData: UpdateEmployeeFormData) {
  try {
    const { id, name, email, employmentDate, basicSalary, isActive } = formData;

    // Get the employee with user
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return { success: false, message: "Employee not found." };
    }

    // Update user data
    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        name,
        email,
      },
    });

    // Update employee data
    await prisma.employee.update({
      where: { id },
      data: {
        employmentDate: new Date(employmentDate),
        basicSalary,
        isActive,
      },
    });

    revalidatePath("/dashboard/employees");
    return { success: true, message: "Employee updated successfully." };
  } catch (error) {
    console.error("Error updating employee:", error);

    if (error.code === "P2002") {
      return { success: false, message: "Email already exists." };
    }

    return { success: false, message: "Failed to update employee." };
  }
}

// Delete employee
export async function deleteEmployee(id: string) {
  try {
    // Get the employee with user
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return { success: false, message: "Employee not found." };
    }

    // First delete the employee record
    await prisma.employee.delete({
      where: { id },
    });

    // Then delete the user record
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    revalidatePath("/dashboard/employees");
    return { success: true, message: "Employee deleted successfully." };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, message: "Failed to delete employee." };
  }
}
