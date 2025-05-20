"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

interface MobileSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[240px]"
      >
        <Sidebar user={user} />
      </SheetContent>
    </Sheet>
  );
}
