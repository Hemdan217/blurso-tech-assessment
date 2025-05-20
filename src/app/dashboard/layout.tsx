import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Blurr HR - Dashboard",
  description: "Employee Management Portal",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Pass user data from session to client components
  const user = {
    ...session.user,
    role: session.user.role || "EMPLOYEE", // Default to EMPLOYEE if role is not present
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <main>{children}</main>
        </div>
        <footer className="border-t border-border/40 p-4 text-center text-sm text-muted-foreground">
          <p>© 2023 Blurr Technologies. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

// Client loading component with spinner
export function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <Spinner
          size="lg"
          variant="primary"
        />
        <p className="text-primary">Loading data...</p>
      </div>
    </div>
  );
}
