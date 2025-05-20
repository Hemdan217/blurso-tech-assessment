"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Plus, FileDown, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SalaryForm, Salary, Employee, FormMode } from "./components/salary-form";
import { createSalary, updateSalary, deleteSalary, generateMonthlySalaries, getPaginatedSalaries } from "./actions";
import { generateMonthlySalariesSchema } from "./schemas";
import { DataTable } from "./components/data-table";
import { SalaryColumns } from "./components/columns";

const ITEMS_PER_PAGE = 10;

export default function SalariesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  // Redirect employees to their own salaries page
  useEffect(() => {
    if (status !== "loading" && session?.user && !isAdmin) {
      router.push("/dashboard/my-salaries");
    }
  }, [status, session, router, isAdmin]);

  // State for data and pagination
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // State for filtering
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [monthDate, setMonthDate] = useState<Date>();

  // State for modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [generationMonth, setGenerationMonth] = useState<Date | undefined>(new Date());

  // Load data
  const loadData = async (page = currentPage, employeeId = employeeFilter, month = monthFilter) => {
    try {
      setLoading(true);

      // Fetch employees for dropdown
      const employeesResponse = await fetch("/api/employees");
      const employeesData = await employeesResponse.json();
      setEmployees(employeesData.employees || []);

      // Fetch salaries with pagination and filters
      const result = await getPaginatedSalaries(page, ITEMS_PER_PAGE, { employeeId, month });

      setSalaries(result.salaries);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalCount);
      setCurrentPage(result.pagination.page);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (status !== "loading" && session?.user && isAdmin) {
      loadData();
    }
  }, [status, session, isAdmin]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page, employeeFilter, monthFilter);
  };

  // Handle filter change
  const handleEmployeeFilterChange = (value: string) => {
    setEmployeeFilter(value);
    // If "all" is selected, pass empty string to filter for all employees
    const employeeId = value === "all" ? "" : value;
    loadData(1, employeeId, monthFilter);
  };

  const handleMonthFilterChange = (date?: Date) => {
    setMonthDate(date);
    if (date) {
      const formattedMonth = format(date, "yyyy-MM");
      setMonthFilter(formattedMonth);
      loadData(1, employeeFilter, formattedMonth);
    } else {
      setMonthFilter("");
      loadData(1, employeeFilter, "");
    }
  };

  // Handle create salary
  const handleCreateSalary = async (data: any) => {
    const result = await createSalary(data);
    if (result.success) {
      loadData();
      setCreateDialogOpen(false);
    }
    return result;
  };

  // Handle edit salary
  const handleEditSalary = async (data: any) => {
    const result = await updateSalary(data);
    if (result.success) {
      loadData();
      setEditDialogOpen(false);
      setSelectedSalary(null);
    }
    return result;
  };

  // Handle delete salary
  const handleDeleteSalary = async () => {
    if (!selectedSalary) return;

    try {
      const result = await deleteSalary(selectedSalary.id);

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
      console.error("Error deleting salary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSalary(null);
    }
  };

  // Handle generate monthly salaries
  const handleGenerateSalaries = async () => {
    if (!generationMonth) return;

    try {
      const formattedMonth = format(generationMonth, "yyyy-MM");
      const result = await generateMonthlySalaries({ month: formattedMonth });

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
      console.error("Error generating salaries:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setGenerateDialogOpen(false);
    }
  };

  // Handlers for table row actions
  const onEdit = (salary: Salary) => {
    setSelectedSalary(salary);
    setEditDialogOpen(true);
  };

  const onDelete = (salary: Salary) => {
    setSelectedSalary(salary);
    setDeleteDialogOpen(true);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p>Redirecting to your salaries...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Salaries</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setGenerateDialogOpen(true)}
            variant="outline"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Generate Monthly
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Salary
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>Manage all employee salaries</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Employee</label>
              <Select
                value={employeeFilter}
                onValueChange={handleEmployeeFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
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
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {monthDate ? format(monthDate, "MMMM yyyy") : "All months"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={monthDate}
                    onSelect={(date) => handleMonthFilterChange(date)}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                    showMonthYearPicker
                  />
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => handleMonthFilterChange(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Salaries Table */}
          <DataTable
            columns={SalaryColumns({ onEdit, onDelete })}
            data={salaries}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Create Salary Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Salary Record</DialogTitle>
            <DialogDescription>Create a new salary record for an employee.</DialogDescription>
          </DialogHeader>
          <SalaryForm
            mode="create"
            employees={employees}
            onSubmit={handleCreateSalary}
            onSuccess={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Salary Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Salary Record</DialogTitle>
            <DialogDescription>Update the salary record details.</DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <SalaryForm
              mode="edit"
              salary={selectedSalary}
              onSubmit={handleEditSalary}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedSalary(null);
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
              This will permanently delete the salary record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSalary}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Monthly Salaries Dialog */}
      <Dialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Salaries</DialogTitle>
            <DialogDescription>
              Automatically create salary records for all active employees for the selected month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {generationMonth ? format(generationMonth, "MMMM yyyy") : "Select month"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={generationMonth}
                    onSelect={(date) => setGenerationMonth(date)}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                    showMonthYearPicker
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={handleGenerateSalaries}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
