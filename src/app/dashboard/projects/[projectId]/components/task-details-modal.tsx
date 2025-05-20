"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MessageCircle } from "lucide-react";
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

export function TaskDetailsModal({ taskId, onClose, onStatusUpdate }: TaskDetailsModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isAssignedUser = task?.employee?.user?.id === session?.user?.id;

  // Load task details
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const result = await getTaskDetails(taskId);
        setTask(result.task);
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

  // Handle task status update
  const handleStatusUpdate = async (newStatus: "PENDING" | "IN_PROGRESS" | "DONE") => {
    try {
      setStatusLoading(true);
      const result = await updateTaskStatus({
        id: taskId,
        status: newStatus,
        note: "",
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Refresh task data and notify parent
        const updatedTask = await getTaskDetails(taskId);
        setTask(updatedTask.task);
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
        setTask(updatedTask.task);
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
                {/* Task Information */}
                <div className="space-y-4">
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

                  {/* Assigned To */}
                  <div>
                    <h3 className="text-sm font-medium mb-1">Assigned To</h3>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${task?.employee?.user?.email}`}
                          alt={task?.employee?.user?.name}
                        />
                        <AvatarFallback className="text-xs">
                          {task?.employee?.user?.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task?.employee?.user?.name}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Created</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{format(new Date(task?.createdAt), "MMM d, yyyy HH:mm")}</span>
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

                  {/* Status Update Buttons */}
                  {(isAdmin || isAssignedUser) && (
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Update Status</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            statusLoading || task?.status === "PENDING" || (!isAdmin && task?.status !== "PENDING")
                          }
                          onClick={() => handleStatusUpdate("PENDING")}
                          className={task?.status === "PENDING" ? "bg-yellow-100" : ""}
                        >
                          To Do
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            statusLoading ||
                            task?.status === "IN_PROGRESS" ||
                            (!isAdmin && task?.status !== "PENDING" && task?.status !== "IN_PROGRESS")
                          }
                          onClick={() => handleStatusUpdate("IN_PROGRESS")}
                          className={task?.status === "IN_PROGRESS" ? "bg-blue-100" : ""}
                        >
                          In Progress
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            statusLoading || task?.status === "DONE" || (!isAdmin && task?.status !== "IN_PROGRESS")
                          }
                          onClick={() => handleStatusUpdate("DONE")}
                          className={task?.status === "DONE" ? "bg-green-100" : ""}
                        >
                          Completed
                        </Button>
                        {statusLoading && (
                          <Spinner
                            size="sm"
                            variant="primary"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add Note */}
                  {(isAdmin || isAssignedUser) && (
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Add Note</h3>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add a note to this task..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="resize-none min-h-[80px]"
                        />
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
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <Card className="border-none shadow-none">
                  <CardHeader className="px-0 pt-4 pb-2">
                    <CardTitle className="text-base">Task History</CardTitle>
                    <CardDescription>Timeline of all activities for this task</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    {task?.actions?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activities yet</p>
                    ) : (
                      <div className="space-y-4">
                        {task?.actions?.map((action: any) => (
                          <div
                            key={action.id}
                            className="border-l-2 pl-4 pb-2 relative before:absolute before:w-3 before:h-3 before:rounded-full before:bg-primary before:left-[-7px] before:top-0"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium">{action.description}</p>
                                {action.oldStatus && action.newStatus && (
                                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                    <Badge
                                      variant="outline"
                                      className="mr-2 text-xs"
                                    >
                                      {action.oldStatus}
                                    </Badge>
                                    <span className="mx-1">→</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {action.newStatus}
                                    </Badge>
                                  </div>
                                )}
                                {action.note && (
                                  <p className="mt-2 text-sm bg-slate-50 p-2 rounded-md">{action.note}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(action.createdAt), "MMM d, HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-[10px]">
                                  {action.user.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs ml-1 text-muted-foreground">{action.user.name}</span>
                            </div>
                          </div>
                        ))}
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
