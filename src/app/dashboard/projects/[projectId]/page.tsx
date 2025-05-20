"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, ListFilter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { getProjectTasks } from "./actions";
import { TaskBoard } from "./components/task-board";
import { TaskTable } from "./components/task-table";
import { CreateTaskModal } from "./components/create-task-modal";
import { TaskDetailsModal } from "./components/task-details-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Project {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GroupedTasks {
  PENDING: Task[];
  IN_PROGRESS: Task[];
  DONE: Task[];
}

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const projectId = params.projectId as string;

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({
    PENDING: [],
    IN_PROGRESS: [],
    DONE: [],
  });
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (status !== "loading" && !isAdmin) {
      router.push("/dashboard");
    }
  }, [status, isAdmin, router]);

  // Load project tasks
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getProjectTasks(projectId);

      // Convert Date objects to strings
      const formattedProject = {
        ...result.project,
        createdAt: result.project.createdAt.toString(),
        updatedAt: result.project.updatedAt.toString(),
      };

      // Convert dates in tasks
      const formattedTasks: GroupedTasks = {
        PENDING: result.tasks.PENDING.map(formatTaskDates),
        IN_PROGRESS: result.tasks.IN_PROGRESS.map(formatTaskDates),
        DONE: result.tasks.DONE.map(formatTaskDates),
      };

      setProject(formattedProject);
      setGroupedTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading project tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format task dates
  const formatTaskDates = (task: {
    id: string;
    title: string;
    description: string | null;
    status: "PENDING" | "IN_PROGRESS" | "DONE";
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
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
      createdAt: Date;
      user: {
        id: string;
        name: string;
      };
    }[];
  }): Task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toString() : null,
    createdAt: task.createdAt.toString(),
    updatedAt: task.updatedAt.toString(),
    actions: task.actions.map((action) => ({
      ...action,
      createdAt: action.createdAt.toString(),
    })),
  });

  // Initial data load
  useEffect(() => {
    if (status !== "loading" && isAdmin && projectId) {
      loadData();
    }
  }, [status, isAdmin, projectId]);

  // Handle task creation
  const handleCreateTaskSuccess = () => {
    loadData();
    setCreateTaskOpen(false);
  };

  // Handle task selection
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // Handle task status update
  const handleTaskStatusUpdate = () => {
    loadData();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <div className="text-center space-y-4">
          <Spinner
            size="lg"
            variant="primary"
          />
          <p className="text-primary animate-pulse-fade">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-8 gap-4">
        <p>Project not found</p>
        <Button
          variant="outline"
          asChild
        >
          <Link href="/dashboard/projects">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/dashboard/projects">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.isArchived && <Badge variant="outline">Archived</Badge>}
        </div>
        <Button onClick={() => setCreateTaskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {project.description && <p className="text-muted-foreground mt-2">{project.description}</p>}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
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

            <TabsContent value="kanban">
              <TaskBoard
                tasks={groupedTasks}
                onTaskClick={handleTaskClick}
                onStatusUpdate={handleTaskStatusUpdate}
              />
            </TabsContent>

            <TabsContent value="backlog">
              <TaskTable
                tasks={[...groupedTasks.PENDING, ...groupedTasks.IN_PROGRESS, ...groupedTasks.DONE]}
                onTaskClick={handleTaskClick}
                onStatusUpdate={handleTaskStatusUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={projectId}
        onSuccess={handleCreateTaskSuccess}
      />

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onStatusUpdate={handleTaskStatusUpdate}
        />
      )}
    </div>
  );
}
