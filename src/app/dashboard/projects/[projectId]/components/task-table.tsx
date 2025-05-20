"use client";

import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, CheckCircle2, Circle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTaskStatus } from "../actions";
import { useToast } from "@/components/ui/use-toast";

// Task interface
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  actions: {
    id: string;
    description: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}

// Status configurations
const statusConfig = {
  PENDING: {
    label: "To Do",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
    icon: Circle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    icon: Clock,
  },
  DONE: {
    label: "Completed",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    icon: CheckCircle2,
  },
};

interface TaskTableProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusUpdate: () => void;
}

export function TaskTable({ tasks, onTaskClick, onStatusUpdate }: TaskTableProps) {
  const { toast } = useToast();

  // Handle task status update
  const handleStatusUpdate = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "DONE") => {
    try {
      const result = await updateTaskStatus({
        id: taskId,
        status: newStatus,
      });

      if (result.success) {
        onStatusUpdate();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task status",
      });
    }
  };

  // Sort tasks by status, due date, and then creation date
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by status first: PENDING -> IN_PROGRESS -> DONE
    const statusOrder = { PENDING: 0, IN_PROGRESS: 1, DONE: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then sort by due date (null dates at the end)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="rounded-md border overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[30%]">Task</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
            <TableHead className="w-[20%]">Assigned To</TableHead>
            <TableHead className="w-[15%]">Due Date</TableHead>
            <TableHead className="w-[20%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center"
              >
                No tasks found for this project.
              </TableCell>
            </TableRow>
          ) : (
            sortedTasks.map((task) => {
              const status = task.status;
              const config = statusConfig[status];
              const Icon = config.icon;
              const isDueToday = task.dueDate
                ? new Date(task.dueDate).toDateString() === new Date().toDateString()
                : false;
              const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && status !== "DONE" : false;

              return (
                <TableRow
                  key={task.id}
                  className={`cursor-pointer hover:bg-muted/50 border-l-4 ${
                    isOverdue ? "border-l-red-500" : isDueToday ? "border-l-amber-500" : "border-l-transparent"
                  }`}
                  onClick={() => onTaskClick(task.id)}
                >
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${config.badgeBg} ${config.badgeText} flex items-center gap-1 w-fit`}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${task.employee.user.email}`}
                          alt={task.employee.user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {task.employee.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.employee.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div
                        className={`flex items-center ${
                          isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-amber-600 font-medium" : ""
                        }`}
                      >
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="text-sm">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                        {isOverdue && (
                          <span className="ml-1.5 bg-red-100 text-red-800 px-1 py-0.5 rounded text-[10px] uppercase font-semibold">
                            Overdue
                          </span>
                        )}
                        {isDueToday && !isOverdue && (
                          <span className="ml-1.5 bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[10px] uppercase font-semibold">
                            Today
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTaskClick(task.id)}>View details</DropdownMenuItem>
                          {status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "IN_PROGRESS")}>
                              Start working
                            </DropdownMenuItem>
                          )}
                          {status === "IN_PROGRESS" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "DONE")}>
                              Mark complete
                            </DropdownMenuItem>
                          )}
                          {status === "DONE" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "IN_PROGRESS")}>
                              Move back to in progress
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
