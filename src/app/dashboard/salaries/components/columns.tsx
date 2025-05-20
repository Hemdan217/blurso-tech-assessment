"use client";

import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Salary } from "./salary-form";

interface ColumnOptions {
  onEdit: (salary: Salary) => void;
  onDelete: (salary: Salary) => void;
}

export function SalaryColumns({ onEdit, onDelete }: ColumnOptions) {
  return [
    {
      header: "Employee",
      accessorKey: "employee",
      cell: (salary: Salary) => (
        <div>
          <div className="font-medium">{salary.employee.user.name}</div>
          <div className="text-sm text-muted-foreground">{salary.employee.employeeId}</div>
        </div>
      ),
    },
    {
      header: "Month",
      accessorKey: "month",
      cell: (salary: Salary) => <div>{format(new Date(salary.month), "MMMM yyyy")}</div>,
    },
    {
      header: "Base Salary",
      accessorKey: "baseSalary",
      cell: (salary: Salary) => <div className="font-medium">${salary.baseSalary.toLocaleString()}</div>,
    },
    {
      header: "Payable",
      accessorKey: "payable",
      cell: (salary: Salary) => {
        const diff = salary.payable - salary.baseSalary;
        const diffColor = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "";
        const diffSign = diff > 0 ? "+" : "";

        return (
          <div>
            <div className="font-medium">${salary.payable.toLocaleString()}</div>
            {diff !== 0 && (
              <div className={`text-xs ${diffColor}`}>
                {diffSign}${diff.toLocaleString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isPaid",
      cell: (salary: Salary) => (
        <Badge variant={salary.isPaid ? "default" : "outline"}>{salary.isPaid ? "Paid" : "Unpaid"}</Badge>
      ),
    },
    {
      header: "Date Created",
      accessorKey: "createdAt",
      cell: (salary: Salary) => (
        <div className="text-sm text-muted-foreground">{format(new Date(salary.createdAt), "MMM dd, yyyy")}</div>
      ),
    },
    {
      header: "Actions",
      cell: (salary: Salary) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(salary)}
            disabled={salary.isPaid}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(salary)}
            disabled={salary.isPaid}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];
}
