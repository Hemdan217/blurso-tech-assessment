// Standard Prisma seed file that will be executed with `npx prisma db seed`
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

// Define enums directly here to avoid import/require issues
const RoleEnum = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
};

async function main() {
  try {
    // Create admin user - use upsert to avoid unique constraint errors
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
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

    // Create employee user - use upsert to avoid unique constraint errors
    const employeePassword = await hash("employee123", 12);
    const employee = await prisma.user.upsert({
      where: { email: "john@example.com" },
      update: {},
      create: {
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

    // Only create project if it doesn't exist
    const existingProject = await prisma.project.findFirst({
      where: { name: "Website Redesign" },
    });

    let project = existingProject;
    if (!existingProject) {
      project = await prisma.project.create({
        data: {
          name: "Website Redesign",
        },
      });
    }

    // Check if employee exists and has employee relation
    if (employee.employee) {
      // Check if task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          title: "Design Homepage",
          projectId: project.id,
        },
      });

      if (!existingTask) {
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
      }
    }

    console.log("Seed data created or updated successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
