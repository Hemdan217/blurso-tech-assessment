"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

// Get admin dashboard stats
export async function getAdminDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        error: "Unauthorized",
      };
    }

    // Get date ranges
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    const firstDayLastMonth = startOfMonth(subMonths(now, 1));
    const lastDayLastMonth = endOfMonth(subMonths(now, 1));

    const firstDayTwoMonthsAgo = startOfMonth(subMonths(now, 2));
    const lastDayTwoMonthsAgo = endOfMonth(subMonths(now, 2));

    // Get total employees count
    const totalEmployees = await prisma.employee.count({
      where: { isActive: true },
    });

    const inactiveEmployees = await prisma.employee.count({
      where: { isActive: false },
    });

    const newHiresThisMonth = await prisma.employee.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Get salary stats
    const salariesThisMonth = await prisma.salary.aggregate({
      _sum: {
        baseSalary: true,
        payable: true,
      },
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Get paid vs unpaid salary stats
    const paidSalaries = await prisma.salary.aggregate({
      _sum: {
        payable: true,
      },
      where: { isPaid: true },
    });

    const unpaidSalaries = await prisma.salary.aggregate({
      _sum: {
        payable: true,
      },
      where: { isPaid: false },
    });

    // Get salary trends for the last 3 months
    const salaryTrends = [
      {
        month: format(subMonths(now, 2), "MMM yyyy"),
        total:
          (
            await prisma.salary.aggregate({
              _sum: { payable: true },
              where: {
                createdAt: {
                  gte: firstDayTwoMonthsAgo,
                  lte: lastDayTwoMonthsAgo,
                },
              },
            })
          )._sum.payable || 0,
      },
      {
        month: format(subMonths(now, 1), "MMM yyyy"),
        total:
          (
            await prisma.salary.aggregate({
              _sum: { payable: true },
              where: {
                createdAt: {
                  gte: firstDayLastMonth,
                  lte: lastDayLastMonth,
                },
              },
            })
          )._sum.payable || 0,
      },
      {
        month: format(now, "MMM yyyy"),
        total: salariesThisMonth._sum.payable || 0,
      },
    ];

    // Get average salary per employee
    const avgSalary = totalEmployees > 0 ? (salariesThisMonth._sum.payable || 0) / totalEmployees : 0;

    // Get project stats
    const activeProjects = await prisma.project.count({
      where: { isArchived: false },
    });

    const archivedProjects = await prisma.project.count({
      where: { isArchived: true },
    });

    // Get task stats
    const tasksByStatus = await Promise.all([
      prisma.task.count({ where: { status: "PENDING" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "DONE" } }),
    ]);

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    });

    // Get tasks completed vs pending this month
    const tasksCompletedThisMonth = await prisma.task.count({
      where: {
        status: "DONE",
        updatedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    const tasksPendingThisMonth = await prisma.task.count({
      where: {
        status: { not: "DONE" },
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Get projects with delayed tasks
    const projectsWithDelays = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            dueDate: { lt: now },
            status: { not: "DONE" },
          },
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tasks: {
              where: {
                dueDate: { lt: now },
                status: { not: "DONE" },
              },
            },
          },
        },
      },
      orderBy: {
        tasks: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get top 5 employees by assigned tasks
    const topEmployeesByTasks = await prisma.employee.findMany({
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        tasks: {
          _count: "desc",
        },
      },
      take: 5,
    });

    return {
      success: true,
      stats: {
        // Employee Stats
        totalEmployees,
        inactiveEmployees,
        newHiresThisMonth,
        attritionRate: totalEmployees > 0 ? (inactiveEmployees / (totalEmployees + inactiveEmployees)) * 100 : 0,

        // Salary Stats
        totalSalariesPaid: paidSalaries._sum.payable || 0,
        totalSalariesUnpaid: unpaidSalaries._sum.payable || 0,
        totalSalariesPayable: salariesThisMonth._sum.payable || 0,
        avgSalaryPerEmployee: avgSalary,
        salaryTrends,

        // Project Stats
        activeProjects,
        archivedProjects,
        projectCompletionRate:
          activeProjects + archivedProjects > 0 ? (archivedProjects / (activeProjects + archivedProjects)) * 100 : 0,
        projectsWithDelays,

        // Task Stats
        tasksByStatus: {
          pending: tasksByStatus[0],
          inProgress: tasksByStatus[1],
          completed: tasksByStatus[2],
        },
        overdueTasks,
        tasksCompletedThisMonth,
        tasksPendingThisMonth,
        taskCompletionRate:
          tasksCompletedThisMonth + tasksPendingThisMonth > 0
            ? (tasksCompletedThisMonth / (tasksCompletedThisMonth + tasksPendingThisMonth)) * 100
            : 0,
        topEmployeesByTasks,
      },
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      error: "Failed to fetch dashboard stats",
    };
  }
}

// Get employee dashboard stats
export async function getEmployeeDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        error: "Unauthorized",
      };
    }

    // Get the employee record for the current user
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!employee) {
      return {
        error: "Employee record not found",
      };
    }

    const employeeId = employee.id;

    // Get date ranges
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    const firstDayTwoMonthsAgo = startOfMonth(subMonths(now, 2));

    // Get task stats
    const tasksByStatus = await Promise.all([
      prisma.task.count({
        where: {
          employee: { id: employeeId },
          status: "PENDING",
        },
      }),
      prisma.task.count({
        where: {
          employee: { id: employeeId },
          status: "IN_PROGRESS",
        },
      }),
      prisma.task.count({
        where: {
          employee: { id: employeeId },
          status: "DONE",
        },
      }),
    ]);

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        employee: { id: employeeId },
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    });

    // Get tasks completed this month
    const tasksCompletedThisMonth = await prisma.task.count({
      where: {
        employee: { id: employeeId },
        status: "DONE",
        updatedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Get current month salary
    const currentSalary = await prisma.salary.findFirst({
      where: {
        employee: { id: employeeId },
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      select: {
        baseSalary: true,
        payable: true,
        createdAt: true,
        isPaid: true,
        changes: true,
      },
    });

    // Get salary history (last 3 months)
    const salaryHistory = await prisma.salary.findMany({
      where: {
        employee: { id: employeeId },
        createdAt: {
          gte: firstDayTwoMonthsAgo,
        },
      },
      select: {
        id: true,
        baseSalary: true,
        payable: true,
        createdAt: true,
        isPaid: true,
        changes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // Get projects assigned to the employee
    const assignedProjects = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            employee: { id: employeeId },
          },
        },
      },
      select: {
        id: true,
        name: true,
        isArchived: true,
        _count: {
          select: {
            tasks: {
              where: {
                employee: { id: employeeId },
              },
            },
          },
        },
      },
    });

    // Calculate average task completion time
    const completedTasks = await prisma.task.findMany({
      where: {
        employee: { id: employeeId },
        status: "DONE",
        createdAt: { not: undefined },
        updatedAt: { not: undefined },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let totalCompletionTime = 0;
    completedTasks.forEach((task) => {
      const creationDate = new Date(task.createdAt);
      const completionDate = new Date(task.updatedAt);
      const diffTime = Math.abs(completionDate.getTime() - creationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalCompletionTime += diffDays;
    });

    const avgCompletionTime = completedTasks.length > 0 ? totalCompletionTime / completedTasks.length : 0;

    return {
      success: true,
      stats: {
        // Personal Task Stats
        tasksByStatus: {
          pending: tasksByStatus[0],
          inProgress: tasksByStatus[1],
          completed: tasksByStatus[2],
        },
        overdueTasks,
        tasksCompletedThisMonth,
        avgTaskCompletionTime: avgCompletionTime,

        // Personal Salary Stats
        currentMonthSalary: currentSalary?.payable || 0,
        salaryIsPaid: currentSalary?.isPaid || false,
        salaryMonth: format(now, "MMMM yyyy"),
        salaryHistory: salaryHistory.map((salary) => ({
          month: format(new Date(salary.createdAt), "MMMM yyyy"),
          amount: salary.payable,
          isPaid: salary.isPaid,
          bonusesAndDeductions: salary.changes,
        })),

        // Project Overview
        assignedProjects: assignedProjects.map((project) => ({
          id: project.id,
          name: project.name,
          status: project.isArchived ? "ARCHIVED" : "ACTIVE",
          taskCount: project._count.tasks,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    return {
      error: "Failed to fetch dashboard stats",
    };
  }
}
