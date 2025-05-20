"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { createSalarySchema, updateSalarySchema, calculatePayable, SalaryChange } from "../schemas";
import { z } from "zod";

export type Employee = {
  id: string;
  employeeId: string;
  basicSalary: number;
  user: {
    name: string;
  };
};

export type Salary = {
  id: string;
  month: Date;
  baseSalary: number;
  payable: number;
  changes: SalaryChange[];
  isPaid: boolean;
  employeeId: string;
  employee: Employee;
  createdAt: Date;
};

export type FormMode = "create" | "edit";

interface SalaryFormProps {
  mode: FormMode;
  employees?: Employee[];
  salary?: Salary;
  onSubmit: (data: any) => Promise<{ success: boolean; message: string }>;
  onSuccess: () => void;
}

export function SalaryForm({ mode, employees = [], salary, onSubmit, onSuccess }: SalaryFormProps) {
  const { toast } = useToast();
  const isEditing = mode === "edit";

  // Only show the employee dropdown in create mode
  const formSchema = isEditing ? updateSalarySchema : createSalarySchema;

  // This needs to be dynamic to support both create and edit forms
  type FormData = z.infer<typeof formSchema>;

  // Set up default values based on mode
  const defaultValues = isEditing
    ? {
        id: salary?.id || "",
        baseSalary: salary?.baseSalary || 0,
        changes: salary?.changes || [],
        payable: salary?.payable || 0,
        isPaid: salary?.isPaid || false,
      }
    : {
        employeeId: "",
        month: format(new Date(), "yyyy-MM"),
        baseSalary: 0,
        changes: [],
        payable: 0,
        isPaid: false,
      };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any,
  });

  // Get form values for calculating payable amount
  const watchBaseSalary = form.watch("baseSalary");
  const watchChanges = form.watch("changes");

  // Recalculate payable amount when baseSalary or changes update
  useEffect(() => {
    const payable = calculatePayable(watchBaseSalary || 0, watchChanges || []);
    form.setValue("payable", payable);
  }, [watchBaseSalary, watchChanges, form]);

  // Handle employee selection (update base salary)
  const handleEmployeeChange = (employeeId: string) => {
    form.setValue("employeeId", employeeId);

    // Find the selected employee
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      // Set the baseSalary based on the employee's basicSalary
      form.setValue("baseSalary", employee.basicSalary);

      // Recalculate payable amount
      const payable = calculatePayable(employee.basicSalary, form.getValues("changes") || []);
      form.setValue("payable", payable);
    }
  };

  // Add a new salary change
  const addChange = () => {
    const currentChanges = form.getValues("changes") || [];
    form.setValue("changes", [...currentChanges, { value: 0, type: "BONUS", note: "" }]);
  };

  // Remove a salary change
  const removeChange = (index: number) => {
    const currentChanges = form.getValues("changes") || [];
    form.setValue(
      "changes",
      currentChanges.filter((_, i) => i !== index),
    );
  };

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
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
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

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
          />
        )}

        {/* Employee Selector (Create mode only) */}
        {!isEditing && (
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select
                  onValueChange={handleEmployeeChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.user.name} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Month Selector (Create mode only) */}
        {!isEditing && (
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Month</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? format(new Date(`${field.value}-01`), "MMMM yyyy") : <span>Select month</span>}
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
                      selected={field.value ? new Date(`${field.value}-01`) : undefined}
                      onSelect={(date) => date && field.onChange(format(date, "yyyy-MM"))}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={2020}
                      toYear={2030}
                      showMonthYearPicker
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Select the month for this salary record</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Display month in edit mode */}
        {isEditing && salary && (
          <div className="rounded-md border p-4">
            <h3 className="font-medium">Salary Details</h3>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Employee</div>
                <div>{salary.employee.user.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Month</div>
                <div>{format(new Date(salary.month), "MMMM yyyy")}</div>
              </div>
            </div>
          </div>
        )}

        {/* Base Salary */}
        <FormField
          control={form.control}
          name="baseSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Salary</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-7"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isEditing && salary?.isPaid}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Salary Changes/Adjustments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Adjustments (Bonus/Deduction)</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChange}
              disabled={isEditing && salary?.isPaid}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Adjustment
            </Button>
          </div>

          {/* List of changes/adjustments */}
          {form.getValues("changes")?.length > 0 ? (
            <div className="space-y-4">
              {form.getValues("changes").map((_, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2"
                >
                  {/* Type: BONUS or DEDUCTION */}
                  <FormField
                    control={form.control}
                    name={`changes.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-1/4">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isEditing && salary?.isPaid}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BONUS">Bonus</SelectItem>
                            <SelectItem value="DEDUCTION">Deduction</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Value amount */}
                  <FormField
                    control={form.control}
                    name={`changes.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-1/4">
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5">$</span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="pl-7"
                              {...field}
                              onChange={(e) => {
                                const type = form.getValues(`changes.${index}.type`);
                                let value = Number(e.target.value);

                                // Ensure value is positive for BONUS and negative for DEDUCTION
                                if (type === "BONUS" && value < 0) value = Math.abs(value);
                                if (type === "DEDUCTION" && value > 0) value = -Math.abs(value);

                                field.onChange(value);
                              }}
                              disabled={isEditing && salary?.isPaid}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Note */}
                  <FormField
                    control={form.control}
                    name={`changes.${index}.note`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Note"
                            {...field}
                            disabled={isEditing && salary?.isPaid}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5"
                    onClick={() => removeChange(index)}
                    disabled={isEditing && salary?.isPaid}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No adjustments added yet
            </div>
          )}
        </div>

        {/* Payable Amount */}
        <FormField
          control={form.control}
          name="payable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payable Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    type="number"
                    className="pl-7 bg-muted"
                    {...field}
                    disabled
                  />
                </div>
              </FormControl>
              <FormDescription>Calculated automatically from base salary and adjustments</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Paid */}
        <FormField
          control={form.control}
          name="isPaid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Mark as Paid</FormLabel>
                <FormDescription>Once marked as paid, this salary record cannot be modified or deleted</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isEditing && salary?.isPaid}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || (isEditing && salary?.isPaid)}
          >
            {form.formState.isSubmitting ? "Submitting..." : isEditing ? "Update Salary" : "Create Salary"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
