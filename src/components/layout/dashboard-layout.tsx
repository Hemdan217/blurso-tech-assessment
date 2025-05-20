"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4 lg:hidden">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-2">
            <MobileSidebar user={user} />
            <span className="font-semibold">Blurr.so HR Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email || "User"}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
