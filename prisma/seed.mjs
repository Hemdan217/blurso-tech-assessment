// Standard Prisma seed file that will be executed with `npx prisma db seed`
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

// Define enums directly here to avoid import/require issues
const RoleEnum = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
};

const TaskStatusEnum = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
};

const NotificationTypeEnum = {
  TASK_ASSIGNMENT: "TASK_ASSIGNMENT",
  TASK_UPDATE: "TASK_UPDATE",
  STATUS_CHANGE: "STATUS_CHANGE",
  GENERAL: "GENERAL",
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
          description: "Redesign the company website with a modern look and feel",
          isArchived: false,
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

      let task;
      if (!existingTask) {
        // Create a sample task
        task = await prisma.task.create({
          data: {
            title: "Design Homepage",
            description: "Create new homepage design with modern UI elements",
            status: TaskStatusEnum.PENDING,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
            assignedToId: employee.employee.id,
            projectId: project.id,
          },
        });

        // Add a task action for the creation
        await prisma.taskAction.create({
          data: {
            taskId: task.id,
            userId: admin.id,
            description: "Task created",
            newStatus: TaskStatusEnum.PENDING,
          },
        });
      } else {
        task = existingTask;
      }

      // Create a welcome notification for admin
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          title: "Welcome to Notifications",
          message: "You have successfully set up the notification system!",
          type: NotificationTypeEnum.GENERAL,
          link: "/dashboard",
          isRead: false,
        },
      });

      // Create a task assignment notification for employee
      await prisma.notification.create({
        data: {
          recipientId: employee.id,
          title: "New Task Assigned",
          message: `You've been assigned to a new task: ${task.title}`,
          type: NotificationTypeEnum.TASK_ASSIGNMENT,
          link: `/dashboard/tasks?taskId=${task.id}`,
          isRead: false,
        },
      });
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
