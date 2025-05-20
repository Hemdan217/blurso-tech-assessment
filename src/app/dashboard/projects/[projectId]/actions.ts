"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  addTaskNoteSchema,
  deleteTaskSchema,
  CreateTaskData,
  UpdateTaskData,
  UpdateTaskStatusData,
  AddTaskNoteData,
  DeleteTaskData,
} from "./schemas";
import {
  createTaskAssignmentNotification,
  createTaskStatusChangeNotification,
  createTaskUpdateNotification,
} from "@/lib/notifications";

// Create a new task
export async function createTask(data: CreateTaskData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = createTaskSchema.parse(data);

    // Create new task
    const task = await prisma.task.create({
      data: {
        title: parsedData.title,
        description: parsedData.description,
        dueDate: parsedData.dueDate,
        assignedToId: parsedData.assignedToId,
        projectId: parsedData.projectId,
        status: "PENDING",
      },
    });

    // Create task action for creation
    await prisma.taskAction.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        description: "Task created",
        newStatus: "PENDING",
      },
    });

    // Get the assigned employee to send them a notification
    const employee = await prisma.employee.findUnique({
      where: { id: parsedData.assignedToId },
      include: { user: true },
    });

    // Create notification for the assigned employee
    if (employee) {
      await createTaskAssignmentNotification({
        taskId: task.id,
        taskTitle: task.title,
        recipientId: employee.user.id,
      });
    }

    revalidatePath(`/dashboard/projects/${parsedData.projectId}`);
    return {
      success: true,
      message: "Task created successfully",
      task,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, message: "Failed to create task" };
  }
}

// Update an existing task
export async function updateTask(data: UpdateTaskData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = updateTaskSchema.parse(data);

    // Get the task to update
    const existingTask = await prisma.task.findUnique({
      where: { id: parsedData.id },
      include: {
        employee: { include: { user: true } },
      },
    });

    if (!existingTask) {
      return { success: false, message: "Task not found" };
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: parsedData.id },
      data: {
        title: parsedData.title,
        description: parsedData.description,
        dueDate: parsedData.dueDate,
      },
    });

    // Create task action for update
    await prisma.taskAction.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        description: "Task details updated",
      },
    });

    // Create notification for the assigned employee
    await createTaskUpdateNotification({
      taskId: task.id,
      taskTitle: task.title,
      recipientId: existingTask.employee.user.id,
      message: "details were updated",
      updatedBy: session.user.name || "Admin",
    });

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);
    return {
      success: true,
      message: "Task updated successfully",
      task,
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, message: "Failed to update task" };
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
      include: {
        employee: { include: { user: true } },
        project: true,
      },
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

    // Create notification based on who updated the status
    if (isAdmin) {
      // Admin updated status - notify employee
      await createTaskStatusChangeNotification({
        taskId: task.id,
        taskTitle: task.title,
        recipientId: existingTask.employee.user.id,
        oldStatus: existingTask.status,
        newStatus: newStatus,
        updatedBy: session.user.name || "Admin",
      });
    } else {
      // Employee updated status - notify admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      // Notify all admins
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

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);
    if (isAssignedEmployee) {
      revalidatePath("/dashboard/tasks");
    }

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

    // Create notification based on who added the note
    if (isAdmin) {
      // Admin added note - notify employee
      await createTaskUpdateNotification({
        taskId: existingTask.id,
        taskTitle: existingTask.title,
        recipientId: existingTask.employee.user.id,
        message: "has a new note",
        updatedBy: session.user.name || "Admin",
      });
    } else {
      // Employee added note - notify admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      // Notify all admins
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

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);
    if (isAssignedEmployee) {
      revalidatePath("/dashboard/tasks");
    }

    return {
      success: true,
      message: "Note added successfully",
    };
  } catch (error) {
    console.error("Error adding task note:", error);
    return { success: false, message: "Failed to add note" };
  }
}

// Delete a task
export async function deleteTask(data: DeleteTaskData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = deleteTaskSchema.parse(data);

    // Get the task to delete
    const existingTask = await prisma.task.findUnique({
      where: { id: parsedData.id },
      include: {
        employee: { include: { user: true } },
      },
    });

    if (!existingTask) {
      return { success: false, message: "Task not found" };
    }

    // Create notification for the assigned employee about task deletion
    await createTaskUpdateNotification({
      taskId: existingTask.id,
      taskTitle: existingTask.title,
      recipientId: existingTask.employee.user.id,
      message: "has been deleted",
      updatedBy: session.user.name || "Admin",
    });

    // Delete all task actions first
    await prisma.taskAction.deleteMany({
      where: { taskId: parsedData.id },
    });

    // Delete task
    await prisma.task.delete({
      where: { id: parsedData.id },
    });

    revalidatePath(`/dashboard/projects/${existingTask.projectId}`);
    return { success: true, message: "Task deleted successfully" };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, message: "Failed to delete task" };
  }
}

// Get tasks for a project grouped by status
export async function getProjectTasks(projectId: string) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is admin or user has access to the project's tasks
    const isAdmin = session.user.role === "ADMIN";

    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: { projectId },
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
      orderBy: { updatedAt: "desc" },
    });

    // Group tasks by status
    const groupedTasks = {
      PENDING: tasks.filter((task) => task.status === "PENDING"),
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
      DONE: tasks.filter((task) => task.status === "DONE"),
    };

    return {
      project,
      tasks: groupedTasks,
    };
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
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

// Get all available employees for task assignment
export async function getAvailableEmployees() {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return { employees };
  } catch (error) {
    console.error("Error fetching available employees:", error);
    throw error;
  }
}
