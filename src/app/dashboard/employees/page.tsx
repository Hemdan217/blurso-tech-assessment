"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { EmployeesList } from "./components/employees-list";
import { EmployeeForm } from "./components/employee-form";
import { createEmployee, updateEmployee } from "./actions";
import { CreateEmployeeFormData, UpdateEmployeeFormData } from "./schemas";

export type Employee = {
  id: string;
  employeeId: string;
  employmentDate: Date;
  basicSalary: number;
  isActive: boolean;
  user: {
    name: string;
    email: string;
  };
};

export default function EmployeesPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || "1");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  // Open edit modal when an employee is selected
  const handleEdit = (employee: Employee) => {
    setEditEmployee(employee);
  };

  // Close edit modal
  const handleEditComplete = () => {
    setEditEmployee(null);
    toast({
      title: "Success",
      description: "Employee updated successfully",
    });
  };

  // Handle create form submission
  const handleCreateSubmit = async (data: CreateEmployeeFormData) => {
    return createEmployee(data);
  };

  // Handle edit form submission
  const handleEditSubmit = async (data: UpdateEmployeeFormData) => {
    return updateEmployee(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Employees</CardTitle>
          <CardDescription>Manage organization employees</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeesList
            page={page}
            limit={10}
            onEdit={handleEdit}
          />
        </CardContent>
      </Card>

      {/* Create Employee Modal */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            mode="create"
            onSubmit={handleCreateSubmit}
            onSuccess={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog
        open={!!editEmployee}
        onOpenChange={(open) => !open && setEditEmployee(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editEmployee && (
            <EmployeeForm
              mode="edit"
              employee={editEmployee}
              onSubmit={handleEditSubmit}
              onSuccess={handleEditComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
