"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Circle,
  RotateCw,
  History,
  Printer,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { getTaskDetails, updateTaskStatus, addTaskNote } from "../actions";
import { useSession } from "next-auth/react";

interface TaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
  onStatusUpdate: () => void;
}

// Define types for task and action
interface TaskAction {
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
}

// Define an interface for the raw task action from the API
interface RawTaskAction {
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
}

interface TaskDetails {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    user: {
      id: string;
      name: string;
      email?: string;
    };
  };
  actions: TaskAction[];
}

export function TaskDetailsModal({ taskId, onClose, onStatusUpdate }: TaskDetailsModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const isAssignedUser = task?.employee?.user?.id === session?.user?.id;

  // Helper function to format task data with proper string dates
  const formatTaskData = (taskData: {
    id: string;
    title: string;
    description: string | null;
    status: "PENDING" | "IN_PROGRESS" | "DONE";
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    project: {
      id: string;
      name: string;
    };
    employee: {
      id: string;
      user: {
        id: string;
        name: string;
        email?: string;
      };
    };
    actions: RawTaskAction[];
  }): TaskDetails => {
    return {
      ...taskData,
      dueDate: taskData.dueDate ? taskData.dueDate.toString() : null,
      createdAt: taskData.createdAt.toString(),
      updatedAt: taskData.updatedAt.toString(),
      actions: taskData.actions.map((action: RawTaskAction) => ({
        ...action,
        createdAt: action.createdAt.toString(),
      })),
    };
  };

  // Load task details
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const result = await getTaskDetails(taskId);
        setTask(formatTaskData(result.task));
      } catch (error) {
        console.error("Error loading task details:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load task details",
        });
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId, toast, onClose]);

  // Determine next status
  const getNextStatus = () => {
    if (!task) return null;

    if (task.status === "PENDING") return "IN_PROGRESS";
    if (task.status === "IN_PROGRESS") return "DONE";
    return null;
  };

  // Handle task status update
  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    try {
      setStatusLoading(true);
      const result = await updateTaskStatus({
        id: taskId,
        status: nextStatus,
        note: noteText || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Clear note text, refresh task data and notify parent
        setNoteText("");
        const updatedTask = await getTaskDetails(taskId);
        setTask(formatTaskData(updatedTask.task));
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
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle note submission
  const handleNoteSubmit = async () => {
    if (!noteText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Note cannot be empty",
      });
      return;
    }

    try {
      setNoteLoading(true);
      const result = await addTaskNote({
        id: taskId,
        note: noteText,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Clear note text, refresh task data
        setNoteText("");
        const updatedTask = await getTaskDetails(taskId);
        setTask(formatTaskData(updatedTask.task));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error adding task note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note",
      });
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={() => onClose()}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner
              size="md"
              variant="primary"
            />
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>Loading Task Details</DialogTitle>
              </VisuallyHidden>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{task?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Project: {task?.project?.name}</p>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent
                value="details"
                className="space-y-4 mt-4"
              >
                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      task?.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : task?.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {task?.status === "PENDING"
                      ? "To Do"
                      : task?.status === "IN_PROGRESS"
                      ? "In Progress"
                      : "Completed"}
                  </Badge>
                </div>

                {/* Description */}
                {task?.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{task?.description}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Created</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{format(new Date(task?.createdAt || Date.now()), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  </div>
                  {task?.dueDate && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Due Date</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{format(new Date(task?.dueDate), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Section - Update Status and Add Note */}
                {isAssignedUser && task?.status !== "DONE" && (
                  <div className="p-4 mt-3 border rounded-md bg-slate-50">
                    <h3 className="font-medium mb-3">Update Task</h3>

                    <div className="mb-3">
                      <Textarea
                        placeholder="Add a note (optional)..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="resize-none min-h-[80px]"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={statusLoading}
                      onClick={handleStatusUpdate}
                    >
                      {statusLoading ? (
                        <div className="flex items-center justify-center">
                          <Spinner
                            size="sm"
                            className="mr-2"
                          />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="mr-2">
                            {task?.status === "PENDING" ? "Start Working on This Task" : "Mark as Completed"}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                )}

                {/* Just Add Note (if task is completed) */}
                {isAssignedUser && task?.status === "DONE" && (
                  <div className="p-4 mt-3 border rounded-md bg-slate-50">
                    <h3 className="font-medium mb-3">Add Note</h3>

                    <div className="mb-3">
                      <Textarea
                        placeholder="Add a note to this task..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="resize-none min-h-[80px]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!noteText.trim() || noteLoading}
                        onClick={handleNoteSubmit}
                      >
                        {noteLoading ? (
                          <div className="flex items-center">
                            <Spinner
                              size="sm"
                              className="mr-2"
                            />
                            <span>Adding...</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>Add Note</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                <Card className="border-none shadow-none">
                  <CardHeader className="px-0 pt-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <History className="mr-2 h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Task History</CardTitle>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          // Create printable version of the timeline
                          const printContent = document.createElement("div");
                          printContent.innerHTML = `
                            <style>
                              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 20px; }
                              h1 { font-size: 18px; margin-bottom: 8px; }
                              h2 { font-size: 16px; margin-bottom: 16px; color: #666; }
                              .timeline { margin-top: 20px; }
                              .action { padding: 12px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
                              .action-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
                              .action-title { font-weight: 600; }
                              .action-time { color: #666; font-size: 12px; }
                              .action-note { background: #f7f7f7; padding: 8px; margin-top: 8px; border-radius: 4px; }
                              .action-user { font-size: 12px; color: #666; margin-top: 8px; }
                              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                              .badge-todo { background: #fff6db; color: #805d00; }
                              .badge-progress { background: #e1f0ff; color: #005fb3; }
                              .badge-done { background: #e6f7e6; color: #008000; }
                              @media print {
                                body { padding: 0; }
                                button { display: none; }
                              }
                            </style>
                            <h1>${task?.title}</h1>
                            <h2>Project: ${task?.project?.name} - Task History</h2>
                            <div class="timeline">
                              ${task?.actions
                                ?.map(
                                  (action) => `
                                <div class="action">
                                  <div class="action-header">
                                    <div class="action-title">${action.description}</div>
                                    <div class="action-time">${format(
                                      new Date(action.createdAt),
                                      "MMM d, yyyy HH:mm",
                                    )}</div>
                                  </div>
                                  ${
                                    action.oldStatus && action.newStatus
                                      ? `
                                    <div>
                                      <span class="badge ${
                                        action.oldStatus === "PENDING"
                                          ? "badge-todo"
                                          : action.oldStatus === "IN_PROGRESS"
                                          ? "badge-progress"
                                          : "badge-done"
                                      }">
                                        ${
                                          action.oldStatus === "PENDING"
                                            ? "To Do"
                                            : action.oldStatus === "IN_PROGRESS"
                                            ? "In Progress"
                                            : "Completed"
                                        }
                                      </span>
                                      →
                                      <span class="badge ${
                                        action.newStatus === "PENDING"
                                          ? "badge-todo"
                                          : action.newStatus === "IN_PROGRESS"
                                          ? "badge-progress"
                                          : "badge-done"
                                      }">
                                        ${
                                          action.newStatus === "PENDING"
                                            ? "To Do"
                                            : action.newStatus === "IN_PROGRESS"
                                            ? "In Progress"
                                            : "Completed"
                                        }
                                      </span>
                                    </div>
                                  `
                                      : ""
                                  }
                                  ${action.note ? `<div class="action-note">${action.note}</div>` : ""}
                                  <div class="action-user">By: ${action.user.name}</div>
                                </div>
                              `,
                                )
                                .join("")}
                            </div>
                          `;

                          // Create a new window and print
                          const printWindow = window.open("", "_blank");
                          printWindow?.document.write(printContent.innerHTML);
                          printWindow?.document.close();
                          printWindow?.focus();
                          setTimeout(() => {
                            printWindow?.print();
                          }, 500);
                        }}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        <span>Print History</span>
                      </Button>
                    </div>
                    <CardDescription>Timeline of all activities for this task</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    {!task?.actions?.length ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No activities recorded yet</p>
                      </div>
                    ) : (
                      <div className="relative space-y-0 pl-6 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-border">
                        {task?.actions?.map((action: TaskAction, index: number) => {
                          // Determine action type icon
                          let ActionIcon = MessageCircle;
                          let iconColorClass = "text-blue-500 bg-blue-50";

                          if (action.description.includes("Status changed")) {
                            ActionIcon = RotateCw;

                            if (action.newStatus === "IN_PROGRESS") {
                              iconColorClass = "text-amber-500 bg-amber-50";
                            } else if (action.newStatus === "DONE") {
                              ActionIcon = CheckCircle;
                              iconColorClass = "text-green-500 bg-green-50";
                            }
                          } else if (action.description.includes("created")) {
                            ActionIcon = Circle;
                            iconColorClass = "text-purple-500 bg-purple-50";
                          }

                          return (
                            <div
                              key={action.id}
                              className={`relative pb-8 ${index === task.actions.length - 1 ? "pb-0" : ""}`}
                            >
                              <div className="absolute left-[-24px] mt-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white">
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded-full ${iconColorClass}`}
                                >
                                  <ActionIcon className="h-2.5 w-2.5" />
                                </div>
                              </div>

                              <div className="flex flex-col rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-sm">{action.description}</span>
                                  <span className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
                                    <Clock className="h-3 w-3 mr-1 inline" />
                                    {format(new Date(action.createdAt), "MMM d, HH:mm")}
                                  </span>
                                </div>

                                {action.oldStatus && action.newStatus && (
                                  <div className="flex items-center my-1.5 text-xs">
                                    <div className="flex-1 flex items-center">
                                      <Badge
                                        variant="outline"
                                        className={`mr-2 text-xs ${
                                          action.oldStatus === "PENDING"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : action.oldStatus === "IN_PROGRESS"
                                            ? "bg-blue-100 text-blue-800 border-blue-200"
                                            : "bg-green-100 text-green-800 border-green-200"
                                        }`}
                                      >
                                        {action.oldStatus === "PENDING"
                                          ? "To Do"
                                          : action.oldStatus === "IN_PROGRESS"
                                          ? "In Progress"
                                          : "Completed"}
                                      </Badge>

                                      <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />

                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          action.newStatus === "PENDING"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : action.newStatus === "IN_PROGRESS"
                                            ? "bg-blue-100 text-blue-800 border-blue-200"
                                            : "bg-green-100 text-green-800 border-green-200"
                                        }`}
                                      >
                                        {action.newStatus === "PENDING"
                                          ? "To Do"
                                          : action.newStatus === "IN_PROGRESS"
                                          ? "In Progress"
                                          : "Completed"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                {action.note && (
                                  <div className="mt-1.5 text-sm p-2 bg-muted/50 rounded-md">
                                    <p className="text-muted-foreground">{action.note}</p>
                                  </div>
                                )}

                                <div className="flex items-center mt-2 pt-1.5 border-t text-xs text-muted-foreground">
                                  <Avatar className="h-5 w-5 mr-1.5">
                                    <AvatarFallback className="text-[10px]">
                                      {action.user.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                    <AvatarImage
                                      src={`https://avatar.vercel.sh/${action.user.id}?size=32`}
                                      alt={action.user.name}
                                    />
                                  </Avatar>
                                  <span>{action.user.name}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
