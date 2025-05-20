"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateProfileSchema, changePasswordSchema, UpdateProfileData, ChangePasswordData } from "./schemas";

// Update user profile (name)
export async function updateUserProfile(data: UpdateProfileData) {
  try {
    // Validate data using schema
    const parsedData = updateProfileSchema.parse(data);

    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    // Update user name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsedData.name },
    });

    revalidatePath("/dashboard/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

// Change user password
export async function changePassword(data: ChangePasswordData) {
  try {
    // Validate data using schema
    const parsedData = await changePasswordSchema.parseAsync(data);

    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { success: false, message: "User not found" };
    }

    // Verify current password
    const isPasswordValid = await compare(parsedData.currentPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await hash(parsedData.newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/dashboard/profile");
    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, message: "Failed to change password" };
  }
}

// Fetch user's employee data if it exists
export async function getUserEmployeeData() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated", employee: null };
    }

    // Get employee data linked to the user
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        employeeId: true,
        employmentDate: true,
        basicSalary: true,
        isActive: true,
      },
    });

    return {
      success: true,
      employee,
    };
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return {
      success: false,
      message: "Failed to fetch employee data",
      employee: null,
    };
  }
}
