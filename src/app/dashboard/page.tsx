import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome {session?.user?.name || "User"}!</CardTitle>
            <CardDescription>You&apos;re logged in with {session?.user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is your protected dashboard page.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Employees</CardTitle>
            <CardDescription>Current employee count</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">24</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>New employee onboarded</li>
              <li>5 pending vacation requests</li>
              <li>Performance review cycle started</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 