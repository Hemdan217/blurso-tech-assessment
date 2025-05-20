"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import { createEmployeeSchema, updateEmployeeSchema, CreateEmployeeFormData, UpdateEmployeeFormData } from "../schemas";
import { Employee } from "../page";

export type FormMode = "create" | "edit";

interface EmployeeFormProps {
  mode: FormMode;
  employee?: Employee;
  onSubmit: (data: CreateEmployeeFormData | UpdateEmployeeFormData) => Promise<{ success: boolean; message: string }>;
  onSuccess: () => void;
}

export function EmployeeForm({ mode, employee, onSubmit, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const isEditing = mode === "edit";

  const formSchema = isEditing ? updateEmployeeSchema : createEmployeeSchema;

  // Type for the defaultValues based on form mode
  type FormData = z.infer<typeof formSchema>;

  const defaultValues: Partial<FormData> = isEditing
    ? {
        id: employee?.id || "",
        name: employee?.user.name || "",
        email: employee?.user.email || "",
        employmentDate: employee?.employmentDate ? format(new Date(employee.employmentDate), "yyyy-MM-dd") : "",
        basicSalary: employee?.basicSalary || 0,
        isActive: employee?.isActive ?? true,
      }
    : {
        name: "",
        email: "",
        password: "",
        employmentDate: format(new Date(), "yyyy-MM-dd"),
        basicSalary: 0,
        isActive: true,
      };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormData,
  });

  async function handleSubmit(data: FormData) {
    try {
      const result = await onSubmit(data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        form.reset();
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (err) {
      console.error("Form submit error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {isEditing && (
          <input
            type="hidden"
            {...form.register("id")}
            value={employee?.id}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Full name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Password must be at least 6 characters long.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="employmentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Employment Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basicSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Basic Salary</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-7"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>Set whether this employee is currently active</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Submitting..." : isEditing ? "Update Employee" : "Create Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
