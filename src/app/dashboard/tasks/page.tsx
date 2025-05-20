"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, ArrowRight } from "lucide-react";
import { getMyTasks, updateTaskStatus } from "./actions";
import { TaskDetailsModal } from "./components/task-details-modal";

export default function MyTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isEmployee = session?.user?.role === "EMPLOYEE";

  // State
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");

  // Redirect admins to the dashboard
  useEffect(() => {
    if (status !== "loading" && session?.user?.role === "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Load tasks
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getMyTasks();
      setTasks(result.tasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (status !== "loading" && isEmployee) {
      loadData();
    }
  }, [status, isEmployee]);

  // Handle task status update
  const handleStatusUpdate = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "DONE") => {
    try {
      const result = await updateTaskStatus({
        id: taskId,
        status: newStatus,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        loadData();
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

  // Handle task selection
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // Filter by due date
    if (dueDateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;

      if (dueDateFilter === "today") {
        if (!taskDueDate) return false;

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return taskDueDate >= today && taskDueDate < tomorrow;
      }

      if (dueDateFilter === "week") {
        if (!taskDueDate) return false;

        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        return taskDueDate >= today && taskDueDate < endOfWeek;
      }

      if (dueDateFilter === "overdue") {
        if (!taskDueDate) return false;
        return taskDueDate < today;
      }

      if (dueDateFilter === "no-due-date") {
        return !taskDueDate;
      }
    }

    return true;
  });

  // Determine if user is an employee
  const isEmployee = session?.user?.role === "EMPLOYEE";

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <div className="text-center space-y-4">
          <Spinner
            size="lg"
            variant="primary"
          />
          <p className="text-primary animate-pulse-fade">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Redirect if not an employee
  if (!isEmployee) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Tasks</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your Assigned Tasks</CardTitle>
          <CardDescription>View and manage all tasks assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Due Date:</span>
              <Select
                value={dueDateFilter}
                onValueChange={setDueDateFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by due date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Due Dates</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="week">Due This Week</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="no-due-date">No Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="board">
            <TabsList className="mb-4">
              <TabsTrigger value="board">Board View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            {/* Board View (Kanban style) */}
            <TabsContent value="board">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {["PENDING", "IN_PROGRESS", "DONE"].map((status) => (
                  <div
                    key={status}
                    className="flex flex-col h-full"
                  >
                    <div
                      className={`p-2 rounded-t-md font-medium ${
                        status === "PENDING"
                          ? "bg-yellow-200"
                          : status === "IN_PROGRESS"
                          ? "bg-blue-200"
                          : "bg-green-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {status === "PENDING" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Completed"}
                        </span>
                        <Badge variant="outline">{tasks.filter((t) => t.status === status).length}</Badge>
                      </div>
                    </div>
                    <div
                      className={`flex-1 p-2 min-h-[300px] rounded-b-md border-2 ${
                        status === "PENDING"
                          ? "bg-yellow-100 border-yellow-300"
                          : status === "IN_PROGRESS"
                          ? "bg-blue-100 border-blue-300"
                          : "bg-green-100 border-green-300"
                      }`}
                    >
                      {filteredTasks.filter((t) => t.status === status).length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4 text-center text-muted-foreground">
                          <p>No tasks in this column</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredTasks
                            .filter((t) => t.status === status)
                            .map((task) => (
                              <Card
                                key={task.id}
                                className="shadow-sm hover:shadow cursor-pointer transition-shadow"
                                onClick={() => handleTaskClick(task.id)}
                              >
                                <CardHeader className="p-3 pb-1">
                                  <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                                    </div>
                                  )}
                                  {status !== "DONE" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(task.id, status === "PENDING" ? "IN_PROGRESS" : "DONE");
                                      }}
                                    >
                                      <span className="mr-1">
                                        {status === "PENDING" ? "Start Working" : "Mark Complete"}
                                      </span>
                                      <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* List View */}
            <TabsContent value="list">
              <div className="mt-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No tasks found with the selected filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="shadow-sm hover:shadow cursor-pointer transition-shadow"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                            <Badge
                              variant="outline"
                              className={
                                task.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {task.status === "PENDING"
                                ? "To Do"
                                : task.status === "IN_PROGRESS"
                                ? "In Progress"
                                : "Completed"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          {task.description && <p className="text-sm text-muted-foreground mb-4">{task.description}</p>}
                          <div className="flex flex-wrap justify-between items-center">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className="mr-3">Project: {task.project.name}</span>
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                                </div>
                              )}
                            </div>
                            {task.status !== "DONE" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 sm:mt-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(task.id, task.status === "PENDING" ? "IN_PROGRESS" : "DONE");
                                }}
                              >
                                <span className="mr-1">
                                  {task.status === "PENDING" ? "Start Working" : "Mark Complete"}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onStatusUpdate={loadData}
        />
      )}
    </div>
  );
}
