import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function EmployeesLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Check if user is authenticated and has ADMIN role
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <div className="w-full">{children}</div>;
}
