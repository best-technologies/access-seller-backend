"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PrintJobsTab from "../components/PrintJobsTab";
import DispatchTab from "../components/DispatchTab";
import RepairsTab from "../components/RepairsTab";
import WorkersTab from "../components/WorkersTab";
import AnalyticsTab from "../components/AnalyticsTab";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrintingInventoryManagerPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("printjobs");

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "inventory_manager" && user?.role !== "admin")) {
      router.replace("/");
    }
  }, [isAuthenticated, user, router]);

  // Mock date filter: only show records from the last month
  // const now = new Date();
  // const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">Printing Press Inventory Management</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="printjobs">Print Jobs</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="printjobs">
          <PrintJobsTab />
        </TabsContent>
        <TabsContent value="dispatch">
          <DispatchTab />
        </TabsContent>
        <TabsContent value="repairs">
          <RepairsTab />
        </TabsContent>
        <TabsContent value="workers">
          <WorkersTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 