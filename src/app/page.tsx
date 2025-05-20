"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to Blurr.so HR Portal
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Streamline your HR operations and boost employee productivity
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    asChild
                  >
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      asChild
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Efficiently manage your workforce with our comprehensive employee management system.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Salary Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Streamline payroll processes with our integrated salary management solution.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Project Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Track project progress and team performance with our intuitive project management tools.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
