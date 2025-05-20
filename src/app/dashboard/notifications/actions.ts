"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for marking notification as read
const markAsReadSchema = z.object({
  id: z.string(),
});

// Get current user's notifications
export async function getMyNotifications(limit: number = 10) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
    });

    return { notifications, unreadCount };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

// Mark a notification as read
export async function markNotificationAsRead(data: { id: string }) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate data
    const parsedData = markAsReadSchema.parse(data);

    // Get the notification
    const notification = await prisma.notification.findUnique({
      where: { id: parsedData.id },
    });

    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    // Check if user owns this notification
    if (notification.recipientId !== session.user.id) {
      return { success: false, message: "You don't have permission to update this notification" };
    }

    // Update notification
    await prisma.notification.update({
      where: { id: parsedData.id },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true, message: "Notification marked as read" };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, message: "Failed to mark notification as read" };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Update all notifications
    await prisma.notification.updateMany({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, message: "All notifications marked as read" };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, message: "Failed to mark all notifications as read" };
  }
}
