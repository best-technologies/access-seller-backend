"use client";

import { useState } from "react";
import KPICards from "@/components/admin/affiliates/KPICards";
import NavigationTabs from "@/components/admin/affiliates/NavigationTabs";
import LeaderboardTab from "@/components/admin/affiliates/LeaderboardTab";
import PayoutsTab from "@/components/admin/affiliates/PayoutsTab";
import EventsTab from "@/components/admin/affiliates/EventsTab";
import AnalyticsTab from "@/components/admin/affiliates/AnalyticsTab";
import AffiliateSettingsModal from "@/components/modals/ReferralSettingsModal";
import useSWR from 'swr';
import { api } from '@/services/api';
import type { AffiliateDashboardResponse } from '@/types/admin/dashboard/dashboard';
import Loader from "@/components/Loader";
import AllAffiliatesTab from '@/components/admin/affiliates/AllAffiliatesTab';
import PendingAffiliatesTab from '@/components/admin/affiliates/PendingAffiliatesTab';

export default function AffiliatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("This Month");
  const [sortBy, setSortBy] = useState("revenue");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [activeSubTab, setActiveSubTab] = useState("topAffiliates");

  // SWR fetcher
  const fetchAffiliateDashboard = async () => {
    return await api.admin.getAffiliateDashboard();
  };

  // SWR hook with 5 min cache
  const { data, error, isLoading } = useSWR<AffiliateDashboardResponse>(
    'admin/affiliates-dashboard',
    fetchAffiliateDashboard,
    { dedupingInterval: 300000, revalidateOnFocus: false }
  );

  // Loading and error states
  if (isLoading) {
    return <Loader/>
  }
  if (error) {
    return <div className="py-20 text-center text-red-500">Failed to load affiliate dashboard: {error.message}</div>;
  }
  if (!data || !data.success) {
    return <div className="py-20 text-center text-gray-500">No affiliate dashboard data available.</div>;
  }

  const dashboard = data.data;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive affiliate performance dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            Settings
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            Export Report
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            Add Affiliate
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AffiliateSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={() => {}}
        initialSettings={dashboard.affiliateSettings}
      />

      {/* Top-Level KPIs */}
      <KPICards kpiCards={dashboard.kpiCards} />

      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Show subtabs only if on Top Affiliates */}
      {activeTab === "leaderboard" && (
        <>
          {/* Subtab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 mb-2">
            {[
              { key: "topAffiliates", label: "Top Affiliates" },
              { key: "all", label: "All" },
              { key: "pending", label: "Pending Approval" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${activeSubTab === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subtab Content */}
          {activeSubTab === "topAffiliates" && (
            <LeaderboardTab
              searchQuery={searchQuery}
              timeframe={timeframe}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onTimeframeChange={setTimeframe}
              onSortByChange={setSortBy}
              leaderboard={dashboard.leaderboard}
            />
          )}
          {activeSubTab === "all" && (
            <AllAffiliatesTab />
          )}
          {activeSubTab === "pending" && (
            <PendingAffiliatesTab />
          )}
        </>
      )}

      {activeTab === "payouts" && <PayoutsTab payouts={dashboard.payouts} />}
      {activeTab === "events" && <EventsTab events={dashboard.events} />}
      {activeTab === "analytics" && <AnalyticsTab analytics={dashboard.analytics} />}
    </div>
  );
}

     