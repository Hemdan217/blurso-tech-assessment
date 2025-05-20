"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { Salary } from "../salaries/components/salary-form";
import { getEmployeeSalaries } from "../salaries/actions";

interface MySalaryColumns {
  header: string;
  accessorKey?: string;
  cell?: (salary: Salary) => React.ReactNode;
  className?: string;
  cellClassName?: string;
}

const ITEMS_PER_PAGE = 10;

export default function MySalariesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // State for data and pagination
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // State for filtering
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [monthDate, setMonthDate] = useState<Date>();

  // Protect route for logged in users only
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch employee ID when session is available
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}/employee`);
          if (response.ok) {
            const data = await response.json();
            if (data.employeeId) {
              setEmployeeId(data.employeeId);
            } else {
              toast({
                variant: "destructive",
                title: "Error",
                description: "You don't have an employee profile",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching employee data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch employee data",
          });
        }
      }
    };

    fetchEmployeeId();
  }, [status, session, toast]);

  // Load employee's salary data
  const loadData = async (page = currentPage, month = monthFilter) => {
    if (!employeeId) {
      return;
    }

    try {
      setLoading(true);

      const result = await getEmployeeSalaries(employeeId, page, ITEMS_PER_PAGE, month);

      setSalaries(result.salaries);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalCount);
      setCurrentPage(result.pagination.page);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load salary data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when employeeId is fetched
  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page, monthFilter);
  };

  // Handle month filter change
  const handleMonthFilterChange = (date?: Date) => {
    setMonthDate(date);
    if (date) {
      const formattedMonth = format(date, "yyyy-MM");
      setMonthFilter(formattedMonth);
      loadData(1, formattedMonth);
    } else {
      setMonthFilter("");
      loadData(1, "");
    }
  };

  // Define columns for employee view (read-only)
  const columns: MySalaryColumns[] = [
    {
      header: "Month",
      cell: (salary) => <div>{format(new Date(salary.month), "MMMM yyyy")}</div>,
    },
    {
      header: "Base Salary",
      cell: (salary) => <div className="font-medium">${salary.baseSalary.toLocaleString()}</div>,
    },
    {
      header: "Adjustments",
      cell: (salary) => {
        if (salary.changes.length === 0) {
          return <div className="text-muted-foreground">None</div>;
        }

        return (
          <div className="space-y-1">
            {salary.changes.map((change, idx) => (
              <div
                key={idx}
                className={`text-sm ${change.type === "BONUS" ? "text-green-600" : "text-red-600"}`}
              >
                <span className="font-medium">
                  {change.type === "BONUS" ? "+" : "-"}${Math.abs(change.value).toLocaleString()}
                </span>
                <span className="text-muted-foreground ml-2">{change.note}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      header: "Payable",
      cell: (salary) => <div className="font-medium">${salary.payable.toLocaleString()}</div>,
    },
    {
      header: "Status",
      cell: (salary) => (
        <div className={`font-medium ${salary.isPaid ? "text-green-600" : "text-amber-600"}`}>
          {salary.isPaid ? "Paid" : "Pending"}
        </div>
      ),
    },
  ];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">My Salaries</h1>

      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>View your salary records and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Filter by Month</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-[240px] justify-start text-left font-normal"
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

          {/* Salary Table */}
          {loading ? (
            <div className="py-8 text-center">Loading salary data...</div>
          ) : salaries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No salary records found</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={`p-3 text-left text-sm font-medium ${column.className || ""}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((salary, index) => (
                    <tr
                      key={salary.id}
                      className={index !== salaries.length - 1 ? "border-b" : ""}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className={`p-3 ${column.cellClassName || ""}`}
                        >
                          {column.cell ? column.cell(salary) : (salary as any)[column.accessorKey!]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {salaries.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} records
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
