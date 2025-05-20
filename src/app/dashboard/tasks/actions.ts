"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createTaskStatusChangeNotification, createTaskUpdateNotification } from "@/lib/notifications";

// Schema for updating task status
const updateTaskStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  note: z.string().optional(),
});

// Schema for adding a note to a task
const addTaskNoteSchema = z.object({
  id: z.string(),
  note: z.string().min(1, "Note cannot be empty"),
});

// Types based on schemas
type UpdateTaskStatusData = z.infer<typeof updateTaskStatusSchema>;
type AddTaskNoteData = z.infer<typeof addTaskNoteSchema>;

// Get tasks assigned to the current employee
export async function getMyTasks() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the employee associated with this user
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
    });

    if (!employee) {
      throw new Error("Employee record not found");
    }

    // Get all tasks assigned to this employee
    const tasks = await prisma.task.findMany({
      where: { assignedToId: employee.id },
      include: {
        project: true,
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    });

    return { tasks };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

// Update task status
export async function updateTaskStatus(data: UpdateTaskStatusData) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data - ensure status is valid
    const parsedData = updateTaskStatusSchema.parse(data);
    const validStatuses = ["PENDING", "IN_PROGRESS", "DONE"];

    if (!validStatuses.includes(parsedData.status)) {
      return { success: false, message: "Invalid task status" };
    }

    // Get the task to update
    const existingTask = await prisma.task.findUnique({
      where: { id: parsedData.id },
      include: { employee: { include: { user: true } } },
    });

    if (!existingTask) {
      return { success: false, message: "Task not found" };
    }

    // Check if user is admin or is the assigned employee
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedEmployee = existingTask.employee.userId === session.user.id;

    if (!isAdmin && !isAssignedEmployee) {
      return { success: false, message: "You don't have permission to update this task" };
    }

    // For employees (non-admins), only allow step-by-step progression
    if (!isAdmin && isAssignedEmployee) {
      const currentStatus = existingTask.status;
      const newStatus = parsedData.status;

      // Only allow PENDING → IN_PROGRESS → DONE (step by step)
      if (
        (currentStatus === "PENDING" && newStatus !== "IN_PROGRESS") ||
        (currentStatus === "IN_PROGRESS" && newStatus !== "DONE")
      ) {
        return {
          success: false,
          message: "You can only move tasks forward one step at a time",
        };
      }
    }

    // Explicitly cast the status to the expected enum type
    const newStatus = parsedData.status;

    // Update task status
    const task = await prisma.task.update({
      where: { id: parsedData.id },
      data: {
        status: newStatus,
      },
    });

    // Create task action for status change
    await prisma.taskAction.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        description: `Status changed from ${existingTask.status} to ${newStatus}`,
        oldStatus: existingTask.status,
        newStatus: newStatus,
        note: parsedData.note,
      },
    });

    // If an employee updated their task, notify admins
    if (isAssignedEmployee && !isAdmin) {
      // Get all admins to notify them
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      // Notify all admins about the status change
      for (const admin of admins) {
        await createTaskStatusChangeNotification({
          taskId: task.id,
          taskTitle: task.title,
          recipientId: admin.id,
          oldStatus: existingTask.status,
          newStatus: newStatus,
          updatedBy: session.user.name || "Employee",
        });
      }
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);

    return {
      success: true,
      message: "Task status updated successfully",
      task,
    };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, message: "Failed to update task status" };
  }
}

// Add a note to a task
export async function addTaskNote(data: AddTaskNoteData) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = addTaskNoteSchema.parse(data);

    // Get the task
    const existingTask = await prisma.task.findUnique({
      where: { id: parsedData.id },
      include: { employee: { include: { user: true } } },
    });

    if (!existingTask) {
      return { success: false, message: "Task not found" };
    }

    // Check if user is admin or is the assigned employee
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedEmployee = existingTask.employee.userId === session.user.id;

    if (!isAdmin && !isAssignedEmployee) {
      return { success: false, message: "You don't have permission to add notes to this task" };
    }

    // Create task action for the note
    await prisma.taskAction.create({
      data: {
        taskId: existingTask.id,
        userId: session.user.id,
        description: "Note added",
        note: parsedData.note,
      },
    });

    // If an employee added a note, notify admins
    if (isAssignedEmployee && !isAdmin) {
      // Get all admins to notify them
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      // Notify all admins about the note
      for (const admin of admins) {
        await createTaskUpdateNotification({
          taskId: existingTask.id,
          taskTitle: existingTask.title,
          recipientId: admin.id,
          message: "has a new note",
          updatedBy: session.user.name || "Employee",
        });
      }
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);

    return {
      success: true,
      message: "Note added successfully",
    };
  } catch (error) {
    console.error("Error adding task note:", error);
    return { success: false, message: "Failed to add note" };
  }
}

// Get task details with full action history
export async function getTaskDetails(taskId: string) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the task with details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: true,
        actions: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Check if user is admin or is the assigned employee
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedEmployee = task.employee.user.id === session.user.id;

    if (!isAdmin && !isAssignedEmployee) {
      throw new Error("You don't have permission to view this task");
    }

    return { task };
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw error;
  }
}

// Get all tasks (for admin users)
export async function getAllTasks() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify user is an admin
    if (session.user.role !== "ADMIN") {
      throw new Error("Only admin users can view all tasks");
    }

    // Get all tasks with their project and assigned employee details
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    });

    // Count tasks by status
    const statusCounts = {
      PENDING: tasks.filter((task) => task.status === "PENDING").length,
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      DONE: tasks.filter((task) => task.status === "DONE").length,
    };

    return {
      tasks,
      statusCounts,
    };
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    throw error;
  }
}
