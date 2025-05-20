import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function StatsPanel({ title, description, icon: Icon, children, className }: StatsPanelProps) {
  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <div>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {Icon && <Icon className="h-5 w-5 text-primary/60" />}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

interface StatsPanelGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function StatsPanelGrid({ children, columns = 2, className }: StatsPanelGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
