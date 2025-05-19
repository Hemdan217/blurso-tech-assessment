/**
 * This is a TypeScript version of the seed file for documentation purposes.
 * The actual seeding happens using the JS version in prisma/seed-data.js
 * to avoid module system compatibility issues.
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// Define enums here for type safety
export const RoleEnum = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];

const prisma = new PrismaClient();

/**
 * Seeds the database with initial data
 */
export async function seed() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: RoleEnum.ADMIN,
      employee: {
        create: {
          employeeId: "000001",
          employmentDate: new Date(),
          basicSalary: 5000,
        },
      },
    },
  });

  // Create employee user
  const employeePassword = await hash("employee123", 12);
  const employee = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: employeePassword,
      role: RoleEnum.EMPLOYEE,
      employee: {
        create: {
          employeeId: "000002",
          employmentDate: new Date(),
          basicSalary: 3000,
        },
      },
    },
    include: { employee: true },
  });

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
    },
  });

  // Create a sample task
  await prisma.task.create({
    data: {
      title: "Design Homepage",
      description: "Create new homepage design with modern UI elements",
      status: "PENDING",
      priority: "HIGH",
      assignedToId: employee.employee.id,
      projectId: project.id,
    },
  });

  console.log("Seed data created successfully");
}

// This file is for documentation - the actual seed runs from prisma/seed-data.js
