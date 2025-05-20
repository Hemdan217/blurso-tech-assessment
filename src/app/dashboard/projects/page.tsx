"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "./components/data-table";
import { Project, ProjectColumns } from "./components/columns";
import { ProjectForm } from "./components/project-form";
import { createProject, updateProject, toggleProjectArchive, deleteProject, getPaginatedProjects } from "./actions";

const ITEMS_PER_PAGE = 10;

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  // State for data
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // State for filters
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");

  // State for modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (status !== "loading" && !isAdmin) {
      router.push("/dashboard");
    }
  }, [status, isAdmin, router]);

  // Load projects data
  const loadData = async (page = currentPage, searchTerm = search, includeArchived = showArchived) => {
    try {
      setLoading(true);
      const result = await getPaginatedProjects(page, ITEMS_PER_PAGE, searchTerm, includeArchived);

      setProjects(result.projects);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalCount);
      setCurrentPage(result.pagination.page);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (status !== "loading" && isAdmin) {
      loadData();
    }
  }, [status, isAdmin]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page, search, showArchived);
  };

  // Handle search
  const handleSearch = () => {
    setSearch(searchInputValue);
    loadData(1, searchInputValue, showArchived);
  };

  const clearSearch = () => {
    setSearchInputValue("");
    setSearch("");
    loadData(1, "", showArchived);
  };

  // Handle archive filter toggle
  const handleShowArchivedToggle = (value: boolean) => {
    setShowArchived(value);
    loadData(1, search, value);
  };

  // Handle project creation
  const handleCreateProject = async (data: any) => {
    const result = await createProject(data);
    if (result.success) {
      loadData();
      setCreateDialogOpen(false);
    }
    return result;
  };

  // Handle project update
  const handleUpdateProject = async (data: any) => {
    const result = await updateProject(data);
    if (result.success) {
      loadData();
      setEditDialogOpen(false);
      setSelectedProject(null);
    }
    return result;
  };

  // Handle project archive/unarchive
  const handleToggleArchive = async (project: Project) => {
    const result = await toggleProjectArchive({
      id: project.id,
      isArchived: !project.isArchived,
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
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const result = await deleteProject({ id: selectedProject.id });

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
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  // Define columns with action handlers
  const columns = ProjectColumns({
    onEdit: (project) => {
      setSelectedProject(project);
      setEditDialogOpen(true);
    },
    onArchive: handleToggleArchive,
    onDelete: (project) => {
      setSelectedProject(project);
      setDeleteDialogOpen(true);
    },
  });

  if (status === "loading") {
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
          <CardDescription>Manage all your organization's projects</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
                {searchInputValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={handleShowArchivedToggle}
                />
                <Label htmlFor="show-archived">Show Archived</Label>
              </div>
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>Create a new project for your organization.</DialogDescription>
                  </DialogHeader>
                  <ProjectForm
                    mode="create"
                    onSubmit={handleCreateProject}
                    onSuccess={() => setCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Projects Table */}
          <DataTable
            columns={columns}
            data={projects}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <ProjectForm
              mode="edit"
              project={selectedProject}
              onSubmit={handleUpdateProject}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedProject(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
