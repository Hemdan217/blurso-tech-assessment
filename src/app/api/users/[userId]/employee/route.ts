import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Define the route handler using the standard Next.js App Router pattern
export async function GET(request: NextRequest, context: { params: { userId: string } }) {
  try {
    const { userId } = context.params;
    const session = await auth();

    // Ensure user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to access their own employee data or admins to access any
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find employee record
    const employee = await prisma.employee.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employeeId: employee.id });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Failed to fetch employee data" }, { status: 500 });
  }
}
