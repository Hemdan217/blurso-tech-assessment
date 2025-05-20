"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated and role is ADMIN
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to access this page.",
      });
      router.push("/dashboard");
    }
  }, [session, status, router, toast]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">System Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Manage system and organization settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings interface will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
