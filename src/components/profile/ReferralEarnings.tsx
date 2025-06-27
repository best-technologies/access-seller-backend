"use client";

import { useState, useEffect } from "react";
import { DollarSign, Users, Copy } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface ReferralEarningsProps {
  affiliateDashboard: Record<string, unknown>;
  refreshAffiliateDashboard: () => void;
}

type AffiliateLink = {
  id: string;
  productId: string;
  slug: string;
  clicks: number;
  orders: number;
  commission: number;
  product: {
    name: string;
    displayImages?: Array<{ secure_url: string }>;
    commission: number;
    sellingPrice: number;
    status: string;
  };
};

export default function ReferralEarnings({ affiliateDashboard, refreshAffiliateDashboard }: ReferralEarningsProps) {
  // All hooks must be called unconditionally
  const [showModal, setShowModal] = useState(false);
  const [niche, setNiche] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [affiliateLinksLoading, setAffiliateLinksLoading] = useState(false);
  const [affiliateLinksError, setAffiliateLinksError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'payouts'>('dashboard');
  const [payoutTab, setPayoutTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Data extraction
  const data = affiliateDashboard || {};
  const isAffiliate = data.is_affiliate as boolean;
  const affiliateStatus = data.affiliate_status as string;
  const createdAt = data.created_at as string;
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
      console.log("[From within the page] Response: ",res)
      if (res.success) {
        toast.success(res.message || "Request sent successfully!");
        setShowModal(false);
        setNiche("");
        setReason("");
        refreshAffiliateDashboard();
      } else {
        toast.error(res.message || "Failed to send request");
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        toast.error((err as { message?: string }).message || "Failed to send request");
      } else {
        toast.error("Failed to send request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render affiliate status UI conditionally, but always call hooks
  let affiliateStatusUI: React.ReactNode = null;
  if (!isAffiliate) {
    if (affiliateStatus === "not_affiliate") {
      affiliateStatusUI = (
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
    } else if (affiliateStatus === "awaiting_approval") {
      affiliateStatusUI = (
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
    } else if (affiliateStatus === "rejected") {
      affiliateStatusUI = (
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
  const stats = (data.stats as Record<string, unknown>) || {};
  const tableAnalysis = (data.tableAnalysis as Array<Record<string, unknown>>) || [];
  console.log("Table analysis: ", tableAnalysis)

  // Fetch affiliate links when products tab is active
  useEffect(() => {
    if (activeTab === 'products' && affiliateLinks.length === 0 && !affiliateLinksLoading) {
      setAffiliateLinksLoading(true);
      setAffiliateLinksError(null);
      api.user.getAffiliateLinks()
        .then((res) => {
          const result = res as unknown as { success: boolean; data: AffiliateLink[]; message?: string };
          if (result.success) {
            setAffiliateLinks(result.data || []);
          } else {
            setAffiliateLinksError(result.message || "Failed to load affiliate links");
          }
        })
        .catch((err: unknown) => {
          if (err && typeof err === 'object' && 'message' in err) {
            setAffiliateLinksError((err as { message?: string }).message || "Failed to load affiliate links");
          } else {
            setAffiliateLinksError("Failed to load affiliate links");
          }
        })
        .finally(() => setAffiliateLinksLoading(false));
    }
  }, [activeTab, affiliateLinks.length, affiliateLinksLoading]);

  // Promoted products from API
  const promotedProducts = affiliateLinks.map((link) => ({
    id: link.id,
    name: link.product.name,
    image: link.product.displayImages?.[0]?.secure_url || '/placeholder.png',
    commission: link.product.commission,
    earningPerSale: (link.product.sellingPrice * Number(link.product.commission)) / 100,
    earnings: link.commission,
    clicks: link.clicks,
    sales: link.orders,
    status: link.product.status === 'active' ? 'Active' : 'Paused',
    shareableLink: `${window.location.origin}/products/${link.productId}?ref=${link.slug}`,
  }));

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 1500);
  };

  // Mock commission payouts data
  const commissionPayouts = [
    {
      id: 'PAYOUT-001',
      amount: 5000,
      date: '2024-06-01',
      status: 'Paid',
      method: 'Bank Transfer',
      reference: 'TXN123456',
    },
    {
      id: 'PAYOUT-002',
      amount: 3000,
      date: '2024-06-10',
      status: 'Pending',
      method: 'Bank Transfer',
      reference: 'TXN123457',
    },
    {
      id: 'PAYOUT-003',
      amount: 7000,
      date: '2024-05-20',
      status: 'Paid',
      method: 'PayPal',
      reference: 'TXN123458',
    },
    {
      id: 'PAYOUT-004',
      amount: 2000,
      date: '2024-06-12',
      status: 'Pending',
      method: 'Bank Transfer',
      reference: 'TXN123459',
    },
  ];

  if (affiliateStatusUI) return affiliateStatusUI;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-150 focus:outline-none ${
            activeTab === 'dashboard'
              ? 'bg-white border border-b-0 border-gray-200 text-indigo-700 shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:text-indigo-600'
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-150 focus:outline-none ${
            activeTab === 'products'
              ? 'bg-white border border-b-0 border-gray-200 text-indigo-700 shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:text-indigo-600'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Promoted Products
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-150 focus:outline-none ${
            activeTab === 'payouts'
              ? 'bg-white border border-b-0 border-gray-200 text-indigo-700 shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:text-indigo-600'
          }`}
          onClick={() => setActiveTab('payouts')}
        >
          Commission Payouts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-semibold text-gray-900">₦{(stats.totalEarned as number) ?? 0}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{(stats.totalPurchases as number) ?? 0}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">₦{(stats.totalWithdrawn as number) ?? 0}</p>
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
            {(tableAnalysis as Array<Record<string, unknown>>).length === 0 ? (
              <p className="text-gray-500">No analysis data available.</p>
            ) : (
              <pre>{JSON.stringify(tableAnalysis, null, 2)}</pre>
            )}
          </div>
        </>
      )}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Products You are Promoting</h3>
            <button
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow transition-colors text-sm"
              // TODO: Add onClick handler to navigate to hot products page
            >
              Explore Hot <span role="img" aria-label="hot">🥵</span> Products
            </button>
          </div>
          
          {affiliateLinksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : affiliateLinksError ? (
            <div className="text-center text-red-500 py-8">{affiliateLinksError}</div>
          ) : promotedProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No promoted products found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commission %</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Earning/Sale</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Overall Earnings</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Clicks</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sales</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Share Link</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {promotedProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      <div className="w-14 h-20 relative rounded overflow-hidden border border-gray-200">
                        <Image src={p.image} alt={p.name} fill className="object-cover rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-2 text-gray-700">{p.commission}%</td>
                    <td className="px-4 py-2 text-gray-700">₦{p.earningPerSale}</td>
                    <td className="px-4 py-2 text-gray-700 font-semibold">₦{p.earnings}</td>
                    <td className="px-4 py-2 text-gray-700">{p.clicks}</td>
                    <td className="px-4 py-2 text-gray-700">{p.sales}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        p.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-indigo-50 px-2 py-1 rounded select-all truncate max-w-[120px]" title={p.shareableLink}>{String(p.shareableLink).replace("'", "&apos;")}</span>
                        <button
                          onClick={() => handleCopyLink(p.shareableLink, p.id)}
                          className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
                          title="Copy shareable link"
                        >
                          <Copy className="h-4 w-4 text-indigo-600" />
                        </button>
                        {copiedLinkId === p.id && (
                          <span className="text-xs text-green-600 font-semibold ml-1">Copied!</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Commission Payouts</h3>
          {/* Sub-sub-tabs */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${
                payoutTab === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:text-indigo-600'
              }`}
              onClick={() => setPayoutTab('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${
                payoutTab === 'pending'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:text-indigo-600'
              }`}
              onClick={() => setPayoutTab('pending')}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${
                payoutTab === 'paid'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:text-indigo-600'
              }`}
              onClick={() => setPayoutTab('paid')}
            >
              Paid
            </button>
          </div>
          {/* Table */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payout ID</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Method</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {commissionPayouts
                .filter(p =>
                  payoutTab === 'all' ? true : payoutTab === 'pending' ? p.status === 'Pending' : p.status === 'Paid'
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{p.id}</td>
                    <td className="px-4 py-2 text-gray-700">₦{p.amount}</td>
                    <td className="px-4 py-2 text-gray-700">{p.date}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        p.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{p.method}</td>
                    <td className="px-4 py-2 text-gray-700">{p.reference}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {commissionPayouts.filter(p =>
            payoutTab === 'all' ? true : payoutTab === 'pending' ? p.status === 'Pending' : p.status === 'Paid'
          ).length === 0 && (
            <div className="text-center text-gray-500 py-8">No payouts found.</div>
          )}
        </div>
      )}
    </div>
  );
} 