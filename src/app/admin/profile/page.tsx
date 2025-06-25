"use client";

import ProfileSettings from "@/components/profile/ProfileSettings";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

export default function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100">
            <User className="h-10 w-10 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.first_name || "Admin"} {user?.last_name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 text-indigo-700 uppercase">{user?.role}</span>
          </div>
        </div>
        <ProfileSettings />
      </div>
    </div>
  );
} 