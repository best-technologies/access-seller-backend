"use client";

import { useState } from "react";
import KPICards from "@/components/admin/referrals/KPICards";
import NavigationTabs from "@/components/admin/referrals/NavigationTabs";
import OverviewTab from "@/components/admin/referrals/OverviewTab";
import LeaderboardTab from "@/components/admin/referrals/LeaderboardTab";
import PayoutsTab from "@/components/admin/referrals/PayoutsTab";
import EventsTab from "@/components/admin/referrals/EventsTab";
import AnalyticsTab from "@/components/admin/referrals/AnalyticsTab";
import ReferralSettingsModal, { ReferralSettings } from "@/components/modals/ReferralSettingsModal";

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("This Month");
  const [sortBy, setSortBy] = useState("revenue");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    referralPercentage: 10,
    minimumReferrals: 1,
    rewardThreshold: 50,
    expirationDays: 30
  });

  const handleSaveSettings = (newSettings: ReferralSettings) => {
    setReferralSettings(newSettings);
    // Save logic here
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive referral performance dashboard</p>
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
            Add Referral
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <ReferralSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveSettings}
        initialSettings={referralSettings}
      />

      {/* Top-Level KPIs */}
      <KPICards />

      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab timeframe={timeframe} onTimeframeChange={setTimeframe} />
      )}
      {activeTab === "leaderboard" && (
        <LeaderboardTab
          searchQuery={searchQuery}
          timeframe={timeframe}
          sortBy={sortBy}
          onSearchChange={setSearchQuery}
          onTimeframeChange={setTimeframe}
          onSortByChange={setSortBy}
        />
      )}
      {activeTab === "payouts" && <PayoutsTab />}
      {activeTab === "events" && <EventsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

     