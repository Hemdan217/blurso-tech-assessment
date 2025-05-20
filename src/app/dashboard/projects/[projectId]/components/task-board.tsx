"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { updateTaskStatus } from "../actions";

// Task interface
interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
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

// Column colors
const statusColors = {
  PENDING: "bg-yellow-100 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 border-blue-300",
  DONE: "bg-green-100 border-green-300",
};

// Column titles
const statusTitles = {
  PENDING: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
};

type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

interface TaskBoardProps {
  tasks: {
    PENDING: Task[];
    IN_PROGRESS: Task[];
    DONE: Task[];
  };
  onTaskClick: (taskId: string) => void;
  onStatusUpdate: () => void;
}

export function TaskBoard({ tasks, onTaskClick, onStatusUpdate }: TaskBoardProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    // Return if dropped outside a droppable area or in the same position
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Explicitly validate the new status
    const validStatuses: TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
    const newStatus = destination.droppableId as TaskStatus;

    if (!validStatuses.includes(newStatus)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid task status",
      });
      return;
    }

    try {
      // Update task status via server action
      const result = await updateTaskStatus({
        id: draggableId,
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

  return (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(statusTitles).map(([status, title]) => (
          <div
            key={status}
            className="flex flex-col h-full"
          >
            <div
              className={`p-2 rounded-t-md font-medium ${
                status === "PENDING" ? "bg-yellow-200" : status === "IN_PROGRESS" ? "bg-blue-200" : "bg-green-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{title}</span>
                <Badge variant="outline">{tasks[status as keyof typeof tasks].length}</Badge>
              </div>
            </div>
            <Droppable droppableId={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 p-2 min-h-[500px] rounded-b-md border-2 ${
                    statusColors[status as keyof typeof statusColors]
                  }`}
                >
                  {tasks[status as keyof typeof tasks]?.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center text-muted-foreground">
                      <p>No tasks in this column</p>
                    </div>
                  ) : (
                    <>
                      {tasks[status as keyof typeof tasks]?.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 transition-transform ${snapshot.isDragging ? "rotate-1 scale-105" : ""}`}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => onTaskClick(task.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card
      className="shadow-sm hover:shadow cursor-pointer transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-base font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 pb-2">
        {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6">
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
          <span className="text-xs">{task.employee.user.name}</span>
        </div>
      </CardContent>
      {task.dueDate && (
        <CardFooter className="p-3 pt-0 flex justify-between">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{format(new Date(task.createdAt), "MMM d")}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
