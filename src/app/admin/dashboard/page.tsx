"use client";

import { useEffect, useState } from "react";
import KPICards from "@/components/admin/dashboard/KPICards";
import ChartsSection from "@/components/admin/dashboard/ChartsSection";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import TopProducts from "@/components/admin/dashboard/TopProducts";
import Notifications from "@/components/admin/dashboard/Notifications";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { api } from "@/services/api";
import type { DashboardResponse } from "@/types/admin/dashboard/dashboard";
import type { DashboardOrder, DashboardNotification, DashboardProduct } from "@/types/admin/dashboard/dashboard";

const DASHBOARD_CACHE_KEY = "admin_dashboard_cache";
const DASHBOARD_CACHE_TIME = 60 * 60 * 1000; // 1 hour in ms

function getCachedDashboard() {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
  console.log("object")
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < DASHBOARD_CACHE_TIME) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedDashboard(data: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    DASHBOARD_CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse["data"] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache unless forceRefresh is true
    if (!forceRefresh) {
      const cachedData = getCachedDashboard();
      if (cachedData) {
        setDashboardData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.admin.dashboard();
      console.log("Response: ", response)
      if (!response.success) throw new Error(response.message || "Failed to fetch dashboard");
      setDashboardData(response.data);
      setCachedDashboard(response.data); // Cache the new data
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard(true).finally(() => setIsRefreshing(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-gray-600 text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchDashboard(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Pass dashboardData to your components as needed
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
          >
            {isRefreshing ? (
              <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards kpis={dashboardData?.dashboard.kpis || []} />

      {/* Charts Section */}
      {/* <ChartsSection salesData={dashboardData?.dashboard.salesData || { labels: [], sales: [], revenue: [], orders: [] }} /> */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <RecentOrders orders={dashboardData?.dashboard.recentOrders as DashboardOrder[] || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <Notifications notifications={dashboardData?.dashboard.notifications as DashboardNotification[] || []} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <TopProducts products={dashboardData?.dashboard.topBooks as DashboardProduct[] || []} />

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Add Product</p>
                  <p className="text-xs text-gray-500">Create new product</p>
                </div>
              </div>
            </button>

            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Add Customer</p>
                  <p className="text-xs text-gray-500">Register new customer</p>
                </div>
              </div>
            </button>

            <button className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Create Order</p>
                  <p className="text-xs text-gray-500">Manual order entry</p>
                </div>
              </div>
            </button>

            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 