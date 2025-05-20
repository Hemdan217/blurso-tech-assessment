import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Archive, Edit, Trash, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

// Project type definition
export interface Project {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    tasks: number;
  };
}

// Column actions props
interface ColumnActionsProps {
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

// Generate columns for project data table
export function ProjectColumns({ onEdit, onArchive, onDelete }: ColumnActionsProps): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{project.name}</span>
            {project.description && (
              <span className="text-sm text-muted-foreground truncate max-w-[250px]">{project.description}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "tasks",
      header: "Tasks",
      cell: ({ row }) => {
        const count = row.original._count.tasks;
        return (
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        return format(new Date(row.original.createdAt), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isArchived = row.original.isArchived;
        return isArchived ? (
          <Badge
            variant="outline"
            className="text-muted-foreground"
          >
            Archived
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            Active
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              asChild
              title="View project details and tasks"
            >
              <Link href={`/dashboard/projects/${project.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(project)}
              title="Edit project"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onArchive(project)}
              title={project.isArchived ? "Unarchive project" : "Archive project"}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(project)}
              disabled={project._count.tasks > 0}
              title={project._count.tasks > 0 ? "Cannot delete project with tasks" : "Delete project"}
              className={project._count.tasks > 0 ? "opacity-50 cursor-not-allowed" : "text-destructive"}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
