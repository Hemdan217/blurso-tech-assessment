"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
  toggleProjectArchiveSchema,
  deleteProjectSchema,
  CreateProjectData,
  UpdateProjectData,
  ToggleProjectArchiveData,
  DeleteProjectData,
} from "./schemas";

// Create a new project
export async function createProject(data: CreateProjectData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = createProjectSchema.parse(data);

    // Create new project
    const project = await prisma.project.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        isArchived: false,
      },
    });

    revalidatePath("/dashboard/projects");
    return {
      success: true,
      message: "Project created successfully",
      project,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, message: "Failed to create project" };
  }
}

// Update an existing project
export async function updateProject(data: UpdateProjectData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = updateProjectSchema.parse(data);

    // Update project
    const project = await prisma.project.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        description: parsedData.description,
      },
    });

    revalidatePath("/dashboard/projects");
    return {
      success: true,
      message: "Project updated successfully",
      project,
    };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, message: "Failed to update project" };
  }
}

// Toggle project archive status
export async function toggleProjectArchive(data: ToggleProjectArchiveData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = toggleProjectArchiveSchema.parse(data);

    // Toggle archive status
    const project = await prisma.project.update({
      where: { id: parsedData.id },
      data: {
        isArchived: parsedData.isArchived,
      },
    });

    revalidatePath("/dashboard/projects");
    return {
      success: true,
      message: `Project ${parsedData.isArchived ? "archived" : "unarchived"} successfully`,
      project,
    };
  } catch (error) {
    console.error("Error toggling project archive status:", error);
    return { success: false, message: "Failed to update project archive status" };
  }
}

// Delete a project (only if it has no tasks)
export async function deleteProject(data: DeleteProjectData) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = deleteProjectSchema.parse(data);

    // Check if project has any tasks
    const tasksCount = await prisma.task.count({
      where: { projectId: parsedData.id },
    });

    if (tasksCount > 0) {
      return {
        success: false,
        message: "Cannot delete project with existing tasks. Archive it instead.",
      };
    }

    // Delete project
    await prisma.project.delete({
      where: { id: parsedData.id },
    });

    revalidatePath("/dashboard/projects");
    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, message: "Failed to delete project" };
  }
}

// Get paginated projects with search and filter
export async function getPaginatedProjects(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  showArchived: boolean = false,
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    // Build filter conditions
    let where = {};

    // Search by name if provided
    if (search) {
      where = {
        ...where,
        name: {
          contains: search,
        },
      };
    }

    // Filter by archive status if not showing archived
    if (!showArchived) {
      where = {
        ...where,
        isArchived: false,
      };
    }

    // Get projects with pagination
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}
