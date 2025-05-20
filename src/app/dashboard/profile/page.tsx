"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { updateUserProfile, changePassword, getUserEmployeeData } from "./actions";
import { updateProfileSchema, changePasswordSchema, UpdateProfileData, ChangePasswordData } from "./schemas";

// Type for employee data
interface EmployeeData {
  id: string;
  employeeId: string;
  employmentDate: Date;
  basicSalary: number;
  isActive: boolean;
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile update form
  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
    },
  });

  // Password change form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (session?.user?.name) {
      profileForm.reset({ name: session.user.name });
    }
  }, [session, profileForm]);

  // Fetch employee data if user is authenticated
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (status === "authenticated") {
        try {
          const result = await getUserEmployeeData();
          if (result.success && result.employee) {
            setEmployee(result.employee as unknown as EmployeeData);
          }
        } catch (error) {
          console.error("Error fetching employee data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmployeeData();
  }, [status]);

  // Handle profile update form submission
  const onSubmitProfile = async (data: UpdateProfileData) => {
    try {
      setIsSubmitting(true);
      const result = await updateUserProfile(data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Update the session with new name
        await updateSession({
          user: {
            name: data.name,
          },
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password change form submission
  const onSubmitPasswordChange = async (data: ChangePasswordData) => {
    try {
      setIsSubmitting(true);
      const result = await changePassword(data);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setIsPasswordDialogOpen(false);
        passwordForm.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <div className="text-center space-y-4">
          <Spinner
            size="lg"
            variant="primary"
          />
          <p className="text-primary animate-pulse-fade">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* User Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{session?.user?.name}</CardTitle>
            <CardDescription>{session?.user?.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onSubmitProfile)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="grid gap-2">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            {...field}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={session?.user?.role || "EMPLOYEE"}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !profileForm.formState.isDirty}
                  className="button-transition"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Spinner
                        size="sm"
                        className="mr-2"
                      />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>

                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                    >
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Update your password to secure your account.</DialogDescription>
                    </DialogHeader>

                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)}
                        className="space-y-4 py-4"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter your current password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a strong password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Must contain at least 8 characters with lowercase, uppercase, number, and symbol.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm your new password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter className="pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPasswordDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmitting || !passwordForm.formState.isDirty}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center">
                                <Spinner
                                  size="sm"
                                  className="mr-2"
                                />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              "Update Password"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Employee Information Card (if available) */}
      {employee ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>Your employee details in the organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={employee.employeeId}
                  disabled
                  className="max-w-md bg-muted/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="employmentDate">Employment Date</Label>
                <Input
                  id="employmentDate"
                  value={format(new Date(employee.employmentDate), "PPP")}
                  disabled
                  className="max-w-md bg-muted/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="basicSalary">Basic Salary</Label>
                <Input
                  id="basicSalary"
                  value={`$${employee.basicSalary.toLocaleString()}`}
                  disabled
                  className="max-w-md bg-muted/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${employee.isActive ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span>{employee.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <p>To update employee information, please contact HR or your administrator.</p>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>No employee record found for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your user account is not linked to any employee profile. If you believe this is an error, please contact
              your administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
