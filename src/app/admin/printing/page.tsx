"use client";

import { useState } from "react";
import { Printer, Package, Wrench, Users, BarChart3 } from "lucide-react";
import PrintJobsTab from "./components/PrintJobsTab";
import DispatchTab from "./components/DispatchTab";
import RepairsTab from "./components/RepairsTab";
import WorkersTab from "./components/WorkersTab";
import AnalyticsTab from "./components/AnalyticsTab";

const tabs = [
  {
    name: "Print Jobs",
    icon: Printer,
    id: "print-jobs",
    component: PrintJobsTab
  },
  {
    name: "Dispatch",
    icon: Package,
    id: "dispatch",
    component: DispatchTab
  },
  {
    name: "Repairs & Maintenance",
    icon: Wrench,
    id: "repairs",
    component: RepairsTab
  },
  {
    name: "Workers",
    icon: Users,
    id: "workers",
    component: WorkersTab
  },
  {
    name: "Print Analytics",
    icon: BarChart3,
    id: "analytics",
    component: AnalyticsTab
  }
];

export default function PrintingPressPage() {
  const [activeTab, setActiveTab] = useState("print-jobs");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PrintJobsTab;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Printing Press</h1>
          <p className="text-gray-600 mt-2">
            Manage all printing operations, dispatch, maintenance, and staff
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        <ActiveComponent />
      </div>
    </div>
  );
} 