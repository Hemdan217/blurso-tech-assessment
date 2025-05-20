"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Briefcase,
  ListChecks,
  CircleAlert,
  CreditCard,
  Calendar,
  Award,
  Activity,
  TrendingUp,
  AlertTriangle,
  BarChart,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatsPanel, StatsPanelGrid } from "@/components/dashboard/stats-panel";
import { ProgressStat } from "@/components/dashboard/progress-stat";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DataList } from "@/components/dashboard/data-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getAdminDashboardStats, getEmployeeDashboardStats } from "./actions";

interface DashboardStats {
  // Common
  error?: string;

  // Admin Stats
  totalEmployees?: number;
  inactiveEmployees?: number;
  newHiresThisMonth?: number;
  attritionRate?: number;
  totalSalariesPaid?: number;
  totalSalariesUnpaid?: number;
  totalSalariesPayable?: number;
  avgSalaryPerEmployee?: number;
  salaryTrends?: Array<{ month: string; total: number }>;
  activeProjects?: number;
  archivedProjects?: number;
  projectCompletionRate?: number;
  tasksByStatus?: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  overdueTasks?: number;
  tasksCompletedThisMonth?: number;
  tasksPendingThisMonth?: number;
  taskCompletionRate?: number;
  projectsWithDelays?: Array<{
    id: string;
    name: string;
    _count: { tasks: number };
  }>;
  topEmployeesByTasks?: Array<{
    id: string;
    user: { name: string };
    _count: { tasks: number };
  }>;

  // Employee Stats
  currentMonthSalary?: number;
  salaryIsPaid?: boolean;
  salaryMonth?: string;
  salaryHistory?: Array<{
    month: string;
    amount: number;
    isPaid: boolean;
    bonusesAndDeductions: Record<string, unknown>;
  }>;
  avgTaskCompletionTime?: number;
  assignedProjects?: Array<{
    id: string;
    name: string;
    status: string;
    taskCount: number;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (isAdmin) {
          const result = await getAdminDashboardStats();
          if (result.error) {
            setError(result.error);
          } else if (result.stats) {
            setStats(result.stats as DashboardStats);
          }
        } else {
          const result = await getEmployeeDashboardStats();
          if (result.error) {
            setError(result.error);
          } else if (result.stats) {
            setStats(result.stats as DashboardStats);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchStats();
    }
  }, [status, isAdmin]);

  const renderAdminDashboard = () => (
    <>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Employees"
          value={stats?.totalEmployees || 0}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Salaries Payable"
          value={stats ? formatCurrency(stats.totalSalariesPayable || 0) : "$0"}
          description={`For ${stats?.salaryTrends?.[2]?.month || "Current Month"}`}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={Briefcase}
          loading={loading}
        />
        <StatCard
          title="Tasks Completed This Month"
          value={stats?.tasksCompletedThisMonth || 0}
          icon={CheckCircle2}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="employee">
        <TabsList className="mb-4">
          <TabsTrigger value="employee">Employee Stats</TabsTrigger>
          <TabsTrigger value="salary">Salary Stats</TabsTrigger>
          <TabsTrigger value="project">Project Stats</TabsTrigger>
          <TabsTrigger value="task">Task Stats</TabsTrigger>
        </TabsList>

        {/* Employee Stats Tab */}
        <TabsContent value="employee">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Employee Overview"
              icon={Users}
              description="Current workforce statistics"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <StatCard
                  title="Active Employees"
                  value={stats?.totalEmployees || 0}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Inactive Employees"
                  value={stats?.inactiveEmployees || 0}
                  className="bg-slate-50"
                />
                <StatCard
                  title="New Hires This Month"
                  value={stats?.newHiresThisMonth || 0}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Attrition Rate"
                  value={`${(stats?.attritionRate || 0).toFixed(1)}%`}
                  className="bg-slate-50"
                />
              </div>

              <ProgressStat
                label="Employee Retention"
                value={100 - (stats?.attritionRate || 0)}
                colorVariant={
                  (stats?.attritionRate || 0) < 5 ? "success" : (stats?.attritionRate || 0) < 15 ? "warning" : "danger"
                }
              />
            </StatsPanel>

            <StatsPanel
              title="Top Performers"
              icon={Award}
              description="Employees with most assigned tasks"
            >
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded"
                    ></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.topEmployeesByTasks?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.user.name}</TableCell>
                        <TableCell className="text-right">{employee._count.tasks}</TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.topEmployeesByTasks || stats.topEmployeesByTasks.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          No employee data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>

        {/* Salary Stats Tab */}
        <TabsContent value="salary">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Salary Overview"
              icon={DollarSign}
              description="Current month salary statistics"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard
                  title="Total Payable"
                  value={stats ? formatCurrency(stats.totalSalariesPayable || 0) : "$0"}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Average Per Employee"
                  value={stats ? formatCurrency(stats.avgSalaryPerEmployee || 0) : "$0"}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Total Paid"
                  value={stats ? formatCurrency(stats.totalSalariesPaid || 0) : "$0"}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Total Unpaid"
                  value={stats ? formatCurrency(stats.totalSalariesUnpaid || 0) : "$0"}
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Payment Status</h3>
                <ProgressStat
                  label="Paid vs Unpaid"
                  value={stats?.totalSalariesPaid || 0}
                  maxValue={(stats?.totalSalariesPaid || 0) + (stats?.totalSalariesUnpaid || 0)}
                  colorVariant="success"
                />
              </div>
            </StatsPanel>

            <StatsPanel
              title="Salary Trends"
              icon={TrendingUp}
              description="Last 3 months of salary data"
            >
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.salaryTrends?.map((trend, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{trend.month}</span>
                      <span className="text-primary font-semibold">{formatCurrency(trend.total)}</span>
                    </div>
                  ))}

                  {(!stats?.salaryTrends || stats.salaryTrends.length === 0) && (
                    <p className="text-center text-muted-foreground">No trend data available</p>
                  )}

                  {stats?.salaryTrends && stats.salaryTrends.length > 1 && (
                    <div className="pt-4 border-t mt-4">
                      <h4 className="text-sm font-medium mb-2">Monthly Change</h4>
                      <div className="flex gap-2 items-center">
                        <span
                          className={
                            stats.salaryTrends[2].total >= stats.salaryTrends[1].total
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {stats.salaryTrends[2].total >= stats.salaryTrends[1].total ? "+" : "-"}
                          {formatCurrency(Math.abs(stats.salaryTrends[2].total - stats.salaryTrends[1].total))}
                        </span>
                        <span className="text-muted-foreground text-sm">from previous month</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>

        {/* Project Stats Tab */}
        <TabsContent value="project">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Project Overview"
              icon={Briefcase}
              description="Project status and performance"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard
                  title="Active Projects"
                  value={stats?.activeProjects || 0}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Archived Projects"
                  value={stats?.archivedProjects || 0}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Completion Rate"
                  value={`${(stats?.projectCompletionRate || 0).toFixed(1)}%`}
                  className="bg-slate-50"
                />
                <StatCard
                  title="Projects With Delays"
                  value={stats?.projectsWithDelays?.length || 0}
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Project Completion</h3>
                <ProgressStat
                  label="Completed vs Active"
                  value={stats?.archivedProjects || 0}
                  maxValue={(stats?.activeProjects || 0) + (stats?.archivedProjects || 0)}
                  colorVariant={
                    (stats?.projectCompletionRate || 0) > 75
                      ? "success"
                      : (stats?.projectCompletionRate || 0) > 50
                      ? "warning"
                      : "default"
                  }
                />
              </div>
            </StatsPanel>

            <StatsPanel
              title="Delayed Projects"
              icon={AlertTriangle}
              description="Projects with overdue tasks"
            >
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded"
                    ></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Overdue Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.projectsWithDelays?.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell className="text-right">
                          <StatusBadge
                            status={project._count.tasks.toString()}
                            variant={
                              project._count.tasks > 5 ? "danger" : project._count.tasks > 2 ? "warning" : "info"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.projectsWithDelays || stats.projectsWithDelays.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          No delayed projects
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>

        {/* Task Stats Tab */}
        <TabsContent value="task">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Task Overview"
              icon={ListChecks}
              description="Task distribution and performance"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="Pending"
                  value={stats?.tasksByStatus?.pending || 0}
                  className="bg-amber-50"
                />
                <StatCard
                  title="In Progress"
                  value={stats?.tasksByStatus?.inProgress || 0}
                  className="bg-blue-50"
                />
                <StatCard
                  title="Completed"
                  value={stats?.tasksByStatus?.completed || 0}
                  className="bg-green-50"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Monthly Task Completion</h3>
                <ProgressStat
                  label="Completed vs Pending"
                  value={stats?.tasksCompletedThisMonth || 0}
                  maxValue={(stats?.tasksCompletedThisMonth || 0) + (stats?.tasksPendingThisMonth || 0)}
                  colorVariant={
                    (stats?.taskCompletionRate || 0) > 75
                      ? "success"
                      : (stats?.taskCompletionRate || 0) > 50
                      ? "warning"
                      : "default"
                  }
                />
              </div>

              {(stats?.overdueTasks || 0) > 0 && (
                <Alert
                  variant="destructive"
                  className="mt-6"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Overdue Tasks</AlertTitle>
                  <AlertDescription>There are {stats?.overdueTasks} tasks past their due date.</AlertDescription>
                </Alert>
              )}
            </StatsPanel>

            <StatsPanel
              title="Task Distribution"
              icon={BarChart}
              description="Task counts by status"
            >
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-40 bg-muted rounded"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span>{stats?.tasksByStatus?.pending || 0}</span>
                      </div>
                      <div className="h-2 bg-amber-100 rounded-full">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${
                              stats
                                ? ((stats.tasksByStatus?.pending || 0) /
                                    ((stats.tasksByStatus?.pending || 0) +
                                      (stats.tasksByStatus?.inProgress || 0) +
                                      (stats.tasksByStatus?.completed || 0))) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span>{stats?.tasksByStatus?.inProgress || 0}</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${
                              stats
                                ? ((stats.tasksByStatus?.inProgress || 0) /
                                    ((stats.tasksByStatus?.pending || 0) +
                                      (stats.tasksByStatus?.inProgress || 0) +
                                      (stats.tasksByStatus?.completed || 0))) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span>{stats?.tasksByStatus?.completed || 0}</span>
                      </div>
                      <div className="h-2 bg-green-100 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${
                              stats
                                ? ((stats.tasksByStatus?.completed || 0) /
                                    ((stats.tasksByStatus?.pending || 0) +
                                      (stats.tasksByStatus?.inProgress || 0) +
                                      (stats.tasksByStatus?.completed || 0))) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <DataList
                    items={[
                      {
                        label: "Task Completion Rate",
                        value: `${(stats?.taskCompletionRate || 0).toFixed(1)}%`,
                      },
                      {
                        label: "Tasks Completed This Month",
                        value: stats?.tasksCompletedThisMonth || 0,
                      },
                      {
                        label: "Overdue Tasks",
                        value: stats?.overdueTasks || 0,
                      },
                    ]}
                  />
                </div>
              )}
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>
      </Tabs>
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="My Tasks"
          value={
            (stats?.tasksByStatus?.pending || 0) +
            (stats?.tasksByStatus?.inProgress || 0) +
            (stats?.tasksByStatus?.completed || 0)
          }
          icon={ListChecks}
          loading={loading}
        />
        <StatCard
          title="Tasks Completed"
          value={stats?.tasksCompletedThisMonth || 0}
          description="This month"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="My Projects"
          value={stats?.assignedProjects?.length || 0}
          icon={Briefcase}
          loading={loading}
        />
        <StatCard
          title="Current Salary"
          value={stats ? formatCurrency(stats.currentMonthSalary || 0) : "$0"}
          description={stats?.salaryIsPaid ? "Paid" : "Pending"}
          icon={DollarSign}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="salary">My Salary</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Task Overview"
              icon={ListChecks}
              description="Your task distribution and performance"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="To Do"
                  value={stats?.tasksByStatus?.pending || 0}
                  className="bg-amber-50"
                />
                <StatCard
                  title="In Progress"
                  value={stats?.tasksByStatus?.inProgress || 0}
                  className="bg-blue-50"
                />
                <StatCard
                  title="Completed"
                  value={stats?.tasksByStatus?.completed || 0}
                  className="bg-green-50"
                />
              </div>

              {(stats?.overdueTasks || 0) > 0 && (
                <Alert
                  variant="destructive"
                  className="mt-2 mb-6"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Overdue Tasks</AlertTitle>
                  <AlertDescription>You have {stats?.overdueTasks} tasks past their due date.</AlertDescription>
                </Alert>
              )}

              <DataList
                items={[
                  {
                    label: "Tasks Completed This Month",
                    value: stats?.tasksCompletedThisMonth || 0,
                  },
                  {
                    label: "Average Completion Time",
                    value: `${(stats?.avgTaskCompletionTime || 0).toFixed(1)} days`,
                  },
                  {
                    label: "Pending + In Progress",
                    value: (stats?.tasksByStatus?.pending || 0) + (stats?.tasksByStatus?.inProgress || 0),
                  },
                ]}
              />
            </StatsPanel>

            <StatsPanel
              title="Task Completion"
              icon={Activity}
              description="Your task performance and efficiency"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Pending</span>
                      <span>{stats?.tasksByStatus?.pending || 0}</span>
                    </div>
                    <div className="h-2 bg-amber-100 rounded-full">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${
                            stats
                              ? ((stats.tasksByStatus?.pending || 0) /
                                  ((stats.tasksByStatus?.pending || 0) +
                                    (stats.tasksByStatus?.inProgress || 0) +
                                    (stats.tasksByStatus?.completed || 0))) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>In Progress</span>
                      <span>{stats?.tasksByStatus?.inProgress || 0}</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            stats
                              ? ((stats.tasksByStatus?.inProgress || 0) /
                                  ((stats.tasksByStatus?.pending || 0) +
                                    (stats.tasksByStatus?.inProgress || 0) +
                                    (stats.tasksByStatus?.completed || 0))) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span>{stats?.tasksByStatus?.completed || 0}</span>
                    </div>
                    <div className="h-2 bg-green-100 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            stats
                              ? ((stats.tasksByStatus?.completed || 0) /
                                  ((stats.tasksByStatus?.pending || 0) +
                                    (stats.tasksByStatus?.inProgress || 0) +
                                    (stats.tasksByStatus?.completed || 0))) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Completion Efficiency</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressStat
                        label="Task Completion Rate"
                        value={stats?.tasksByStatus?.completed || 0}
                        maxValue={
                          (stats?.tasksByStatus?.pending || 0) +
                          (stats?.tasksByStatus?.inProgress || 0) +
                          (stats?.tasksByStatus?.completed || 0)
                        }
                        colorVariant={
                          ((stats?.tasksByStatus?.completed || 0) /
                            ((stats?.tasksByStatus?.pending || 0) +
                              (stats?.tasksByStatus?.inProgress || 0) +
                              (stats?.tasksByStatus?.completed || 0))) *
                            100 >
                          75
                            ? "success"
                            : ((stats?.tasksByStatus?.completed || 0) /
                                ((stats?.tasksByStatus?.pending || 0) +
                                  (stats?.tasksByStatus?.inProgress || 0) +
                                  (stats?.tasksByStatus?.completed || 0))) *
                                100 >
                              50
                            ? "warning"
                            : "default"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <StatsPanelGrid columns={2}>
            <StatsPanel
              title="Current Salary"
              icon={CreditCard}
              description={`For ${stats?.salaryMonth || "Current Month"}`}
            >
              <div className="text-center py-6">
                <div className="text-3xl font-bold mb-2">
                  {stats ? formatCurrency(stats.currentMonthSalary || 0) : "$0"}
                </div>
                <StatusBadge
                  status={stats?.salaryIsPaid ? "Paid" : "Pending"}
                  variant={stats?.salaryIsPaid ? "success" : "warning"}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">Payment Details</h3>
                <DataList
                  items={[
                    {
                      label: "Status",
                      value: (
                        <StatusBadge
                          status={stats?.salaryIsPaid ? "Paid" : "Pending"}
                          variant={stats?.salaryIsPaid ? "success" : "warning"}
                        />
                      ),
                    },
                    {
                      label: "Month",
                      value: stats?.salaryMonth || "Current Month",
                    },
                    {
                      label: "Base Amount",
                      value: formatCurrency(stats?.currentMonthSalary || 0),
                    },
                  ]}
                />
              </div>
            </StatsPanel>

            <StatsPanel
              title="Salary History"
              icon={Calendar}
              description="Last 3 months of payments"
            >
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.salaryHistory?.map((salary, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-md"
                    >
                      <div>
                        <div className="font-medium">{salary.month}</div>
                        <StatusBadge
                          status={salary.isPaid ? "Paid" : "Pending"}
                          variant={salary.isPaid ? "success" : "warning"}
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(salary.amount)}</div>
                      </div>
                    </div>
                  ))}

                  {(!stats?.salaryHistory || stats.salaryHistory.length === 0) && (
                    <p className="text-center text-muted-foreground">No salary history available</p>
                  )}
                </div>
              )}
            </StatsPanel>
          </StatsPanelGrid>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <StatsPanel
            title="My Projects"
            icon={Briefcase}
            description="Projects you're assigned to"
          >
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted rounded"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.assignedProjects?.map((project, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <StatusBadge
                          status={project.status}
                          variant={project.status === "ACTIVE" ? "success" : "secondary"}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Assigned Tasks</span>
                        <span>{project.taskCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!stats?.assignedProjects || stats.assignedProjects.length === 0) && (
                  <p className="text-center text-muted-foreground">No projects assigned</p>
                )}
              </div>
            )}
          </StatsPanel>
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <CircleAlert className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-6 h-28 animate-pulse"
                  >
                    <div className="bg-muted h-4 w-20 mb-4 rounded"></div>
                    <div className="bg-muted h-8 w-16 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="border rounded-lg p-8 animate-pulse">
                <div className="h-80 bg-muted rounded"></div>
              </div>
            </div>
          ) : (
            <>{isAdmin ? renderAdminDashboard() : renderEmployeeDashboard()}</>
          )}
        </>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          {isAdmin
            ? "You're viewing the admin dashboard with comprehensive HR analytics."
            : "You're viewing your personal dashboard with task and salary information."}
        </p>
      </div>
    </div>
  );
}
