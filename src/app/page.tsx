"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Blurr.so HR Portal
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-prose">
        Technical Assessment Project for Blurr.so
      </p>
      
      <div className="flex gap-4 mt-10">
        {status === "loading" ? (
          <Button disabled>Loading...</Button>
        ) : session ? (
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </>
        )}
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        This project was created as a technical assessment for Blurr.so interview process
      </div>
    </div>
  );
}
