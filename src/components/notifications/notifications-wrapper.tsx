"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { getMyNotifications } from "@/app/dashboard/notifications/actions";
import { Spinner } from "@/components/ui/spinner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsWrapper() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await getMyNotifications(10);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on initial load and when pathname changes
  useEffect(() => {
    fetchNotifications();
  }, [pathname]);

  // Refetch notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Spinner className="h-5 w-5" />;
  }

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
