"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Settings, LogOut, Folders, DollarSign, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}

export function DashboardSidebar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="hidden w-64 border-r bg-background lg:block">
      <div className="flex h-full max-h-screen flex-col">
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-4">
            <SidebarNavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              title="Overview"
            />

            {isAdmin && (
              <SidebarNavItem
                href="/dashboard/employees"
                icon={<Users className="h-4 w-4" />}
                title="Employees"
              />
            )}

            {/* Salaries link - available to all but with different views based on role */}
            <SidebarNavItem
              href="/dashboard/salaries"
              icon={<DollarSign className="h-4 w-4" />}
              title="Salaries"
            />

            {/* Tasks link - available to all users */}
            <SidebarNavItem
              href="/dashboard/tasks"
              icon={<ListTodo className="h-4 w-4" />}
              title="Tasks"
            />

            {/* Projects link - only visible to admin users */}
            {isAdmin && (
              <SidebarNavItem
                href="/dashboard/projects"
                icon={<Folders className="h-4 w-4" />}
                title="Projects"
              />
            )}

            <div className="mt-4 text-xs font-medium uppercase text-muted-foreground">Settings</div>
            <SidebarNavItem
              href="/dashboard/settings"
              icon={<Settings className="h-4 w-4" />}
              title="Settings"
            />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
