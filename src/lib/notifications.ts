import { prisma } from "@/lib/prisma";

// Define NotificationType enum to match Prisma schema
enum NotificationType {
  TASK_ASSIGNMENT = "TASK_ASSIGNMENT",
  TASK_UPDATE = "TASK_UPDATE",
  STATUS_CHANGE = "STATUS_CHANGE",
  GENERAL = "GENERAL",
}

/**
 * Creates a notification record in the database
 */
export async function createNotification({
  recipientId,
  title,
  message,
  type,
  link,
}: {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        title,
        message,
        type,
        link,
        isRead: false,
      },
    });
    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

/**
 * Creates a task assignment notification
 */
export async function createTaskAssignmentNotification({
  taskId,
  taskTitle,
  recipientId,
}: {
  taskId: string;
  taskTitle: string;
  recipientId: string;
}) {
  return createNotification({
    recipientId,
    title: "New Task Assigned",
    message: `You've been assigned to a new task: ${taskTitle}`,
    type: NotificationType.TASK_ASSIGNMENT,
    link: `/dashboard/tasks?taskId=${taskId}`,
  });
}

/**
 * Creates a task status change notification
 */
export async function createTaskStatusChangeNotification({
  taskId,
  taskTitle,
  recipientId,
  oldStatus,
  newStatus,
  updatedBy,
}: {
  taskId: string;
  taskTitle: string;
  recipientId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
}) {
  return createNotification({
    recipientId,
    title: "Task Status Updated",
    message: `Task "${taskTitle}" status changed from ${oldStatus} to ${newStatus} by ${updatedBy}`,
    type: NotificationType.STATUS_CHANGE,
    link: `/dashboard/tasks?taskId=${taskId}`,
  });
}

/**
 * Creates a task update notification (for notes, etc.)
 */
export async function createTaskUpdateNotification({
  taskId,
  taskTitle,
  recipientId,
  message,
  updatedBy,
}: {
  taskId: string;
  taskTitle: string;
  recipientId: string;
  message: string;
  updatedBy: string;
}) {
  return createNotification({
    recipientId,
    title: "Task Updated",
    message: `Task "${taskTitle}" ${message} by ${updatedBy}`,
    type: NotificationType.TASK_UPDATE,
    link: `/dashboard/tasks?taskId=${taskId}`,
  });
}

/**
 * Gets notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 10) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return { notifications, unreadCount };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error };
  }
}

/**
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error };
  }
}
