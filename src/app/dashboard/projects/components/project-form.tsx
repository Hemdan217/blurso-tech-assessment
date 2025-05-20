"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { createProjectSchema, updateProjectSchema, CreateProjectData, UpdateProjectData } from "../schemas";
import { Project } from "./columns";

type FormMode = "create" | "edit";

interface ProjectFormProps {
  mode: FormMode;
  project?: Project;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<any>;
  onSuccess?: () => void;
}

export function ProjectForm({ mode, project, onSubmit, onSuccess }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Use appropriate schema based on mode
  const formSchema = mode === "create" ? createProjectSchema : updateProjectSchema;

  // Initialize form with react-hook-form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "create"
        ? { name: "", description: "" }
        : {
            id: project?.id || "",
            name: project?.name || "",
            description: project?.description || "",
          },
  });

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const result = await onSubmit(data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Reset form if creating new project
        if (mode === "create") {
          form.reset();
        }

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter project description (optional)"
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Spinner
                  size="sm"
                  className="mr-2"
                />
                <span>{mode === "create" ? "Creating..." : "Updating..."}</span>
              </div>
            ) : (
              <span>{mode === "create" ? "Create Project" : "Update Project"}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
