"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  Folder,
  LogOut,
  ChevronLeft,
  CreditCard,
  UserCircle,
  Menu,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

function SidebarNavItem({ href, icon, title }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent group",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="transition-colors">{title}</span>
    </Link>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const role = user?.role || "EMPLOYEE";
  const isAdmin = role === "ADMIN";

  const sidebarContent = (
    <div className={cn("flex h-full max-h-screen flex-col gap-2", isCollapsed ? "items-center" : "")}>
      <div className="flex h-16 items-center justify-between px-4 border-b w-full">
        {!isCollapsed && (
          <Link
            href="/"
            className="font-semibold"
          >
            Blurr.so HR Portal
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto h-9 w-9"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed ? "rotate-180" : "")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className={cn("flex flex-col gap-2 py-2", isCollapsed ? "items-center" : "")}>
          <SidebarNavItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            title={isCollapsed ? "" : "Dashboard"}
          />

          {isAdmin && (
            <SidebarNavItem
              href="/dashboard/employees"
              icon={<Users className="h-4 w-4" />}
              title={isCollapsed ? "" : "Employees"}
            />
          )}

          <SidebarNavItem
            href="/dashboard/salaries"
            icon={<CreditCard className="h-4 w-4" />}
            title={isCollapsed ? "" : "Salaries"}
          />

          <SidebarNavItem
            href="/dashboard/tasks"
            icon={<ListTodo className="h-4 w-4" />}
            title={isCollapsed ? "" : "Tasks"}
          />

          {isAdmin && (
            <SidebarNavItem
              href="/dashboard/projects"
              icon={<Folder className="h-4 w-4" />}
              title={isCollapsed ? "" : "Projects"}
            />
          )}

          <SidebarNavItem
            href="/dashboard/profile"
            icon={<UserCircle className="h-4 w-4" />}
            title={isCollapsed ? "" : "My Profile"}
          />

          {isAdmin && (
            <SidebarNavItem
              href="/dashboard/settings"
              icon={<Settings className="h-4 w-4" />}
              title={isCollapsed ? "" : "Settings"}
            />
          )}
        </div>
      </ScrollArea>

      <div className={cn("border-t p-4", isCollapsed ? "flex justify-center" : "")}>
        <Button
          variant="outline"
          className={cn("w-full justify-start gap-2", isCollapsed ? "justify-center px-0" : "")}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 w-[240px]"
        >
          <div className="h-full w-full">{sidebarContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
