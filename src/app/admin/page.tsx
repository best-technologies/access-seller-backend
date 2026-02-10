"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for authentication to be checked
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Check if user has admin or super_admin role
    console.log("User role: ", user?.role)
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      router.push("/admin/dashboard");
    } else {
      // Redirect non-admin users to home page
      router.push("/");
    }
  }, [router, user, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-gray-600">
          {isLoading ? "Checking permissions..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
} 