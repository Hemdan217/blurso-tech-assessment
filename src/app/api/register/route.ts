import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Function to generate a random 6-digit employee ID
function generateEmployeeId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role, employmentDate, basicSalary } = await req.json();

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Name, email, password, and role are required" }, { status: 400 });
    }

    // Validate role
    if (role !== "ADMIN" && role !== "EMPLOYEE") {
      return NextResponse.json({ message: "Role must be either ADMIN or EMPLOYEE" }, { status: 400 });
    }

    // If role is EMPLOYEE, validate employee specific fields
    if (role === "EMPLOYEE" && (!employmentDate || !basicSalary)) {
      return NextResponse.json(
        { message: "Employment date and basic salary are required for employees" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user with transaction to ensure consistency
    const user = await prisma.$transaction(async (prisma) => {
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as Role,
        },
      });

      // If the role is EMPLOYEE, create an employee record
      if (role === "EMPLOYEE") {
        // Generate a unique employee ID
        let employeeId;
        let isUnique = false;

        while (!isUnique) {
          employeeId = generateEmployeeId();
          const existingEmployee = await prisma.employee.findUnique({
            where: { employeeId },
          });
          isUnique = !existingEmployee;
        }

        // Create the employee record
        await prisma.employee.create({
          data: {
            employeeId,
            employmentDate: new Date(employmentDate),
            basicSalary: Number(basicSalary),
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });

    // Exclude password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
