"use client";

import { useState } from "react";
import { DollarSign, Users, TrendingUp, ArrowUpRight, Share2 } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";

interface ReferralEarningsProps {
  affiliateDashboard: any;
  refreshAffiliateDashboard: () => void;
}

export default function ReferralEarnings({ affiliateDashboard, refreshAffiliateDashboard }: ReferralEarningsProps) {
  const [showModal, setShowModal] = useState(false);
  const [niche, setNiche] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const data = affiliateDashboard || {};
  console.log("data: ", data)
  const isAffiliate = data.is_affiliate;
  const affiliateStatus = data.affiliate_status;
  const createdAt = data.created_at;
  // console.log("Affiliate status: ", affiliateStatus)
  // console.log("is Affiliate status: ", isAffiliate)
  // Helper for 3-day check
  let canContactSupport = false;
  if (createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    canContactSupport = diff >= 3;
  }

  const handleAffiliateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.user.requestAffiliateAccess(niche, reason);
      console.log("[From withint the page] Response: ",res)
      if (res.success) {
        toast.success(res.message || "Request sent successfully!");
        setShowModal(false);
        setNiche("");
        setReason("");
        refreshAffiliateDashboard();
      } else {
        toast.error(res.message || "Failed to send request");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAffiliate) {
    if (affiliateStatus === "not_affiliate") {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">You are not an affiliate yet</h2>
          <p className="text-gray-600 mb-4">Become an affiliate to earn commissions by referring others.</p>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
            onClick={() => setShowModal(true)}
          >
            Request to Become an Affiliate
          </button>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowModal(false)}>&times;</button>
                <h3 className="text-lg font-semibold mb-4">Affiliate Request</h3>
                <form className="space-y-4" onSubmit={handleAffiliateRequest}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g. Books, Electronics"
                      value={niche}
                      onChange={e => setNiche(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to become an affiliate?</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Tell us why..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (affiliateStatus === "awaiting_approval") {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Affiliate Request Awaiting Approval</h2>
          <p className="text-gray-600 mb-4">Your request to become an affiliate is being reviewed. You will be notified once a decision is made.</p>
          <button
            className={`px-6 py-2 rounded-lg font-medium ${canContactSupport ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            disabled={!canContactSupport}
          >
            Contact Support
          </button>
          {!canContactSupport && (
            <p className="text-xs text-gray-400 mt-2">You can contact support 3 days after your request was made.</p>
          )}
        </div>
      );
    }
    if (affiliateStatus === "rejected") {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Affiliate Request Rejected</h2>
          <p className="text-gray-600 mb-4">Your request to become an affiliate was rejected. You may update your information and request again.</p>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
            onClick={() => setShowModal(true)}
          >
            Request Again
          </button>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowModal(false)}>&times;</button>
                <h3 className="text-lg font-semibold mb-4">Affiliate Request</h3>
                <form className="space-y-4" onSubmit={handleAffiliateRequest}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g. Books, Electronics"
                      value={niche}
                      onChange={e => setNiche(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to become an affiliate?</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Tell us why..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  // If affiliate, show dashboard
  const stats = data.stats || {};
  const tableAnalysis = data.tableAnalysis || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <p className="text-2xl font-semibold text-gray-900">₦{stats.totalEarned ?? 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPurchases ?? 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
              <p className="text-2xl font-semibold text-gray-900">₦{stats.totalWithdrawn ?? 0}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Table Analysis Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>
        {tableAnalysis.length === 0 ? (
          <p className="text-gray-500">No analysis data available.</p>
        ) : (
          <pre>{JSON.stringify(tableAnalysis, null, 2)}</pre>
        )}
      </div>
    </div>
  );
} 