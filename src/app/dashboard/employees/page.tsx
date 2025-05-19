import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmployeesPage() {
  const employees = [
    { id: 1, name: "John Doe", position: "Frontend Developer", department: "Engineering", status: "Active" },
    { id: 2, name: "Jane Smith", position: "Product Manager", department: "Product", status: "Active" },
    { id: 3, name: "Michael Johnson", position: "UX Designer", department: "Design", status: "Active" },
    { id: 4, name: "Sarah Williams", position: "Backend Developer", department: "Engineering", status: "On Leave" },
    { id: 5, name: "Robert Brown", position: "DevOps Engineer", department: "Operations", status: "Active" },
  ];

  return (
    <div className="container p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Manage your organization&apos;s employees</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 