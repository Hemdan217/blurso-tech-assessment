"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { NotificationsWrapper } from "@/components/notifications/notifications-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Only show auth content after component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Authenticated state is only valid after mounting on client
  const isAuthenticated = mounted && status === "authenticated";
  const isLoading = mounted && status === "loading";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background px-10">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-semibold"
          >
            Blurr.so HR Portal
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {/* Authentication-dependent UI */}
          {!mounted ? (
            // Show placeholder during SSR and initial render
            <div className="flex items-center h-8 w-8"></div>
          ) : isLoading ? (
            <div className="flex items-center">
              <Spinner
                size="sm"
                className="text-primary"
              />
            </div>
          ) : isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className={pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className={
                    pathname.startsWith("/dashboard")
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  Dashboard
                </Link>
              </div>

              {/* Notifications */}
              <NotificationsWrapper />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{session?.user?.name ? getInitials(session.user.name) : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session?.user?.name && <p className="font-medium">{session.user.name}</p>}
                      {session?.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="cursor-pointer flex w-full items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
