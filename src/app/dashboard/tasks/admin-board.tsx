"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ArrowRight,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  ListFilter,
  User,
  Search,
} from "lucide-react";
import { getAllTasks, updateTaskStatus } from "./actions";
import { TaskDetailsModal } from "./components/task-details-modal";

// Define Task interface
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  project: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  actions?: Array<{
    id: string;
    description: string;
    note: string | null;
    oldStatus: "PENDING" | "IN_PROGRESS" | "DONE" | null;
    newStatus: "PENDING" | "IN_PROGRESS" | "DONE" | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

// Status configurations
const statusConfig = {
  PENDING: {
    label: "To Do",
    bgColor: "bg-yellow-200",
    containerBg: "bg-yellow-100",
    containerBorder: "border-yellow-300",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
    icon: Circle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgColor: "bg-blue-200",
    containerBg: "bg-blue-100",
    containerBorder: "border-blue-300",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    icon: Clock,
  },
  DONE: {
    label: "Completed",
    bgColor: "bg-green-200",
    containerBg: "bg-green-100",
    containerBorder: "border-green-300",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    icon: CheckCircle2,
  },
};

export default function AdminTasksBoard() {
  const { toast } = useToast();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("dueDate");
  const [statusCounts, setStatusCounts] = useState({
    PENDING: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  });

  // Load tasks
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getAllTasks();

      // Convert Date objects to strings for compatibility with our Task interface
      const formattedTasks = result.tasks.map(
        (task: {
          id: string;
          title: string;
          description: string | null;
          status: "PENDING" | "IN_PROGRESS" | "DONE";
          dueDate: Date | null;
          project: {
            id: string;
            name: string;
          };
          employee: {
            id: string;
            user: {
              id: string;
              name: string;
              email: string;
            };
          };
          actions?: Array<{
            id: string;
            description: string;
            note: string | null;
            oldStatus: "PENDING" | "IN_PROGRESS" | "DONE" | null;
            newStatus: "PENDING" | "IN_PROGRESS" | "DONE" | null;
            createdAt: Date;
            user: {
              id: string;
              name: string;
            };
          }>;
        }) => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.toString() : null,
          actions: task.actions?.map((action) => ({
            ...action,
            createdAt: action.createdAt.toString(),
          })),
        }),
      );

      setTasks(formattedTasks);
      setStatusCounts(result.statusCounts);
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
    loadData();
  }, []);

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

  // Get unique projects for filtering
  const projects = Array.from(new Set(tasks.map((task) => task.project.id)))
    .map((projectId) => {
      const task = tasks.find((t) => t.project.id === projectId);
      return {
        id: projectId,
        name: task?.project.name || "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get unique employees for filtering
  const employees = Array.from(new Set(tasks.map((task) => task.employee.id)))
    .map((employeeId) => {
      const task = tasks.find((t) => t.employee.id === employeeId);
      return {
        id: employeeId,
        name: task?.employee.user.name || "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // Filter by project
    if (projectFilter !== "all" && task.project.id !== projectFilter) {
      return false;
    }

    // Filter by employee
    if (employeeFilter !== "all" && task.employee.id !== employeeFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description && task.description.toLowerCase().includes(normalizedQuery)) ||
        task.project.name.toLowerCase().includes(normalizedQuery) ||
        task.employee.user.name.toLowerCase().includes(normalizedQuery)
      );
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOption === "dueDate") {
      // Put tasks with no due date at the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortOption === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortOption === "project") {
      return a.project.name.localeCompare(b.project.name);
    }
    if (sortOption === "employee") {
      return a.employee.user.name.localeCompare(b.employee.user.name);
    }
    return 0;
  });

  // Get tasks by status
  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <div className="text-center space-y-4">
          <Spinner
            size="lg"
            variant="primary"
          />
          <p className="text-primary animate-pulse-fade">Loading all tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">All Tasks</h1>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 flex items-center gap-1"
          >
            <Circle className="w-3 h-3" /> To Do: {statusCounts.PENDING}
          </Badge>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" /> In Progress: {statusCounts.IN_PROGRESS}
          </Badge>
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Completed: {statusCounts.DONE}
          </Badge>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
          <CardDescription>View and manage all tasks in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
              <span className="text-sm text-muted-foreground whitespace-nowrap">Project:</span>
              <Select
                value={projectFilter}
                onValueChange={setProjectFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Employee:</span>
              <Select
                value={employeeFilter}
                onValueChange={setEmployeeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By:</span>
              <Select
                value={sortOption}
                onValueChange={setSortOption}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="kanban">
            <TabsList className="mb-4">
              <TabsTrigger
                value="kanban"
                className="flex items-center gap-1"
              >
                <div className="grid grid-cols-3 gap-0.5 h-3 w-6">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
                <span>Kanban Board</span>
              </TabsTrigger>
              <TabsTrigger
                value="backlog"
                className="flex items-center gap-1"
              >
                <ListFilter className="h-4 w-4" />
                <span>Backlog</span>
              </TabsTrigger>
            </TabsList>

            {/* Kanban Board View */}
            <TabsContent value="kanban">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {["PENDING", "IN_PROGRESS", "DONE"].map((status) => {
                  const config = statusConfig[status as keyof typeof statusConfig];
                  const statusTasks = getTasksByStatus(status);
                  const Icon = config.icon;

                  return (
                    <div
                      key={status}
                      className="flex flex-col h-full"
                    >
                      <div
                        className={`p-3 rounded-t-md font-medium ${config.bgColor} flex justify-between items-center`}
                      >
                        <span className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {config.label}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono bg-white/30 backdrop-blur-sm"
                        >
                          {statusTasks.length}
                        </Badge>
                      </div>
                      <div
                        className={`flex-1 p-3 min-h-[500px] rounded-b-md border-2 ${config.containerBg} ${config.containerBorder} overflow-y-auto shadow-inner`}
                      >
                        {statusTasks.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                            <Icon className="h-8 w-8 mb-2 opacity-20" />
                            <p>No tasks in {config.label.toLowerCase()}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {statusTasks.map((task) => {
                              const isDueToday = task.dueDate
                                ? new Date(task.dueDate).toDateString() === new Date().toDateString()
                                : false;
                              const isOverdue = task.dueDate
                                ? new Date(task.dueDate) < new Date() && status !== "DONE"
                                : false;

                              return (
                                <Card
                                  key={task.id}
                                  className={`shadow-sm hover:shadow-md cursor-pointer transition-all border-l-4 ${
                                    isOverdue
                                      ? "border-l-red-500"
                                      : isDueToday
                                      ? "border-l-amber-500"
                                      : `border-l-${
                                          status === "PENDING" ? "yellow" : status === "IN_PROGRESS" ? "blue" : "green"
                                        }-400`
                                  }`}
                                  onClick={() => handleTaskClick(task.id)}
                                >
                                  <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-base font-medium line-clamp-2">{task.title}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0">
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex flex-col gap-2 mt-2">
                                      <div className="text-xs text-muted-foreground flex items-center">
                                        <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5"></span>
                                        <span className="truncate">{task.project.name}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        <span className="truncate">{task.employee.user.name}</span>
                                      </div>

                                      {task.dueDate && (
                                        <div
                                          className={`flex items-center text-xs ${
                                            isOverdue
                                              ? "text-red-500 font-medium"
                                              : isDueToday
                                              ? "text-amber-600 font-medium"
                                              : "text-muted-foreground"
                                          }`}
                                        >
                                          <Calendar className="h-3 w-3 mr-1" />
                                          <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                                          {isOverdue && (
                                            <span className="ml-1 bg-red-100 text-red-800 px-1 rounded text-[10px] uppercase font-semibold">
                                              Overdue
                                            </span>
                                          )}
                                          {isDueToday && !isOverdue && (
                                            <span className="ml-1 bg-amber-100 text-amber-800 px-1 rounded text-[10px] uppercase font-semibold">
                                              Today
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {status !== "DONE" && (
                                        <Button
                                          variant={status === "PENDING" ? "outline" : "default"}
                                          size="sm"
                                          className={`mt-1 w-full ${
                                            status === "IN_PROGRESS" ? "bg-green-600 hover:bg-green-700" : ""
                                          }`}
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
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Backlog View */}
            <TabsContent value="backlog">
              {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <ListFilter className="h-12 w-12 mb-3 opacity-20" />
                  <p>No tasks found with the selected filters.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[30%]">Task</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <TableHead className="w-[15%]">Project</TableHead>
                        <TableHead className="w-[15%]">Employee</TableHead>
                        <TableHead className="w-[15%]">Due Date</TableHead>
                        <TableHead className="w-[15%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.map((task) => {
                        const status = task.status;
                        const config = statusConfig[status as keyof typeof statusConfig];
                        const Icon = config.icon;
                        const isDueToday = task.dueDate
                          ? new Date(task.dueDate).toDateString() === new Date().toDateString()
                          : false;
                        const isOverdue = task.dueDate
                          ? new Date(task.dueDate) < new Date() && status !== "DONE"
                          : false;

                        return (
                          <TableRow
                            key={task.id}
                            className={`cursor-pointer hover:bg-muted/50 border-l-4 ${
                              isOverdue
                                ? "border-l-red-500"
                                : isDueToday
                                ? "border-l-amber-500"
                                : "border-l-transparent"
                            }`}
                            onClick={() => handleTaskClick(task.id)}
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
                              <div className="flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5"></span>
                                <span className="text-sm truncate block max-w-[120px]">{task.project.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                <span className="text-sm truncate block max-w-[120px]">{task.employee.user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div
                                  className={`flex items-center ${
                                    isOverdue
                                      ? "text-red-500 font-medium"
                                      : isDueToday
                                      ? "text-amber-600 font-medium"
                                      : ""
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
                                    <DropdownMenuItem onClick={() => handleTaskClick(task.id)}>
                                      View details
                                    </DropdownMenuItem>
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
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
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
