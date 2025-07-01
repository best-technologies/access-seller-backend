"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign, Users, Copy } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";
import Image from "next/image";
import InlineSpinner from "@/components/profile/InlineSpinner";

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

// Type for table analysis row
type TableAnalysisRow = {
  orderId: string;
  displayImage?: string;
  buyerName?: string;
  buyerEmail?: string;
  orderAmount?: number;
  commissionEarned?: number;
  orderDate?: string;
  status?: string;
  approved?: boolean;
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
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const bankInputRef = useRef<HTMLInputElement>(null);
  const [analysisTab, setAnalysisTab] = useState<'analysis' | 'payouts'>('analysis');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

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
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        toast.error((err as { message: string }).message || "Failed to send request");
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
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
          if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
            setAffiliateLinksError((err as { message: string }).message || "Failed to load affiliate links");
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

  // Bank list state and cache logic
  const [banks, setBanks] = useState<{ id: number; name: string; code: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  // Mock account data (for now)
  const accounts = [
    {
      bank: 'Access Bank',
      accountNumber: '1234567890',
      accountName: 'Mayowa Oluwaremi',
    },
    {
      bank: 'GTBank',
      accountNumber: '0987654321',
      accountName: 'Bernard Mayowa',
    },
  ];
  const maxAccounts = 3;
  const canAdd = accounts.length < maxAccounts;

  const fetchBanks = async () => {
    setBanksLoading(true);
    setBanksError(null);
    try {
      const cache = localStorage.getItem('paystack_banks');
      const cacheTime = localStorage.getItem('paystack_banks_time');
      const now = Date.now();
      if (cache && cacheTime && now - parseInt(cacheTime) < 24 * 60 * 60 * 1000) {
        setBanks(JSON.parse(cache));
        setBanksLoading(false);
        return;
      }
      const res = await api.paystack.getBanks() as unknown as { success: boolean; message: string; data: { id: number; name: string; code: string }[] };
      // console.log("Response from backend: ", res)
      if (res.success && Array.isArray(res.data)) {
        setBanks(res.data);
        localStorage.setItem('paystack_banks', JSON.stringify(res.data));
        localStorage.setItem('paystack_banks_time', now.toString());
      } else {
        throw new Error(res.message || 'Failed to fetch banks');
      }
    } catch (err: unknown) {
      let message = 'Failed to fetch banks';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      setBanksError(message);
      toast.error(message);
    } finally {
      setBanksLoading(false);
    }
  };

  const filteredBanks = banks.filter(bank => bank.name.toLowerCase().includes(bankSearch.toLowerCase()));

  // Helper to reset modal state
  const resetBankModal = () => {
    setSelectedBank("");
    setSelectedBankCode("");
    setAccountNumber("");
    setVerifying(false);
    setAccountName("");
    setBankSubmitting(false);
    setBankSuccess(false);
    setVerifyError(null);
  };

  const openBankModal = () => {
    resetBankModal();
    fetchBanks();
    setShowBankModal(true);
  };

  const closeBankModal = () => {
    setShowBankModal(false);
    resetBankModal();
  };

  // Account number verification effect
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      setVerifying(true);
      setVerifyError(null);
      api.paystack.verifyAccountNumber(accountNumber, selectedBankCode)
        .then((res) => {
          const result = res as { success: boolean; message: string; data: string };
          if (result.success && result.data) {
            setAccountName(result.data);
          } else {
            setAccountName("");
            setVerifyError(result.message || 'Verification failed');
            toast.error(result.message || 'Verification failed');
          }
        })
        .catch((err: unknown) => {
          let message = 'Verification failed';
          if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
            message = (err as { message: string }).message;
          }
          setAccountName("");
          setVerifyError(message);
          toast.error(message);
        })
        .finally(() => setVerifying(false));
    } else {
      setAccountName("");
      setVerifyError(null);
    }
  }, [accountNumber, selectedBankCode]);

  const canSubmitBank = selectedBank && accountNumber.length === 10 && accountName && !verifying && !bankSubmitting;

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSubmitting(true);
    try {
      const bankName = banks.find(b => String(b.id) === selectedBank)?.name || '';
      const payload = {
        bankName,
        bankCode: selectedBankCode,
        accountNumber,
        accountName,
      };
      const res = await api.user.addBankAccount(payload);
      console.log("[DEBUG] addBankAccount response:", res, typeof res, Array.isArray(res));
      if (res && res.success) {
        toast.success(res.message || 'Bank account added successfully!');
        setBankSuccess(true);
        setTimeout(() => {
          closeBankModal();
        }, 1500);
      } else {
        toast.error(res.message || 'Failed to add bank account');
      }
    } catch (err: unknown) {
      let message = 'Failed to add bank account';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      console.error("[DEBUG] Error in addBankAccount:", err);
      toast.error(message);
    } finally {
      setBankSubmitting(false);
    }
  };

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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
              <div className="relative group">
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none ${canAdd ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  disabled={!canAdd}
                  onClick={() => canAdd && openBankModal()}
                >
                  Add Bank Account
                </button>
                {!canAdd && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200">
                    You&apos;t add more than 3 bank accounts.
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Bank:</span>
                    <span className="text-gray-600">{acc.bank}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Account Number:</span>
                    <span className="text-gray-600">{acc.accountNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Account Name:</span>
                    <span className="text-gray-600">{acc.accountName}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Modal for Add Bank Account */}
            {showBankModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={closeBankModal}>&times;</button>
                  <h4 className="text-lg font-bold mb-4">Add Bank Account</h4>
                  <form className="space-y-4" onSubmit={handleBankSubmit}>
                    {/* Bank Select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                      {banksLoading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500"><InlineSpinner size={16}/> Loading banks...</div>
                      ) : banksError ? (
                        <div className="flex items-center gap-2 text-xs text-red-500">{banksError} <button className="underline ml-2" onClick={fetchBanks}>Retry</button></div>
                      ) : (
                        <div className="relative">
                          <input
                            ref={bankInputRef}
                            type="text"
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${accountName ? ' blur-[1.5px]' : ''}`}
                            placeholder="Search or select your bank"
                            value={selectedBank ? banks.find(b => b.id === parseInt(selectedBank))?.name || bankSearch : bankSearch}
                            onChange={e => {
                              setBankSearch(e.target.value);
                              setSelectedBank("");
                              setSelectedBankCode("");
                              setShowBankDropdown(true);
                            }}
                            onFocus={() => setShowBankDropdown(true)}
                            disabled={!!accountName}
                            autoComplete="off"
                          />
                          {showBankDropdown && !accountName && (
                            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                              {filteredBanks.length === 0 ? (
                                <div className="px-4 py-2 text-gray-400 text-sm">No banks found</div>
                              ) : (
                                filteredBanks.map(bank => (
                                  <div
                                    key={bank.id}
                                    className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 text-sm ${selectedBank === String(bank.id) ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                                    onClick={() => {
                                      setSelectedBank(String(bank.id));
                                      setSelectedBankCode(bank.code);
                                      setBankSearch("");
                                      setShowBankDropdown(false);
                                    }}
                                  >
                                    {bank.name}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Account Number Input */}
                    {selectedBank && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          className={`w-full border border-gray-300 rounded-lg px-3 py-2${accountName ? ' blur-[1.5px]' : ''}`}
                          maxLength={10}
                          value={accountNumber}
                          onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 10-digit account number"
                          required
                          disabled={!!accountName}
                        />
                        {verifying && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500"><InlineSpinner size={16} /> Verifying...</div>
                        )}
                        {verifyError && !verifying && (
                          <div className="mt-1 text-xs text-red-600 font-semibold">{verifyError}</div>
                        )}
                        {accountName && !verifying && !verifyError && (
                          <div className="mt-1 text-xs text-green-600 font-semibold">{accountName}</div>
                        )}
                      </div>
                    )}
                    <button
                      type="submit"
                      className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60 flex items-center justify-center gap-2`}
                      disabled={!canSubmitBank}
                    >
                      {bankSubmitting ? <InlineSpinner size={20} /> : "Submit"}
                    </button>
                    {bankSuccess && (
                      <div className="text-center text-green-600 font-semibold mt-2">Withdrawal successfully completed!</div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
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
            {/* Sub-tabs for Analysis and Payouts */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${analysisTab === 'analysis' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                onClick={() => setAnalysisTab('analysis')}
              >
                Analysis
              </button>
              <button
                className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${analysisTab === 'payouts' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                onClick={() => setAnalysisTab('payouts')}
              >
                Payouts
              </button>
            </div>
            {/* Content for each sub-tab */}
            {analysisTab === 'analysis' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>
                {(tableAnalysis as Array<TableAnalysisRow>).length === 0 ? (
                  <p className="text-gray-500">No analysis data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Buyer Name</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commission</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Withdraw</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {(tableAnalysis as Array<TableAnalysisRow>).map((order, idx) => (
                          <tr key={order.orderId || idx}>
                            <td className="px-4 py-2">
                              {order.displayImage ? (
                                <div className="w-14 h-20 relative rounded overflow-hidden border border-gray-200">
                                  <Image src={order.displayImage} alt="Order" fill className="object-cover rounded" />
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs">{order.orderId}</td>
                            <td className="px-4 py-2">{order.buyerName}</td>
                            <td className="px-4 py-2">{order.buyerEmail}</td>
                            <td className="px-4 py-2">₦{order.orderAmount}</td>
                            <td className="px-4 py-2">₦{order.commissionEarned}</td>
                            <td className="px-4 py-2">{order.orderDate ? order.orderDate : ''}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'inactive' ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
                            </td>
                            <td className="px-4 py-2">
                              <button
                                className={`px-3 py-1 rounded font-semibold text-xs transition-colors focus:outline-none ${order.approved && order.status === 'pending' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                disabled={!(order.approved && order.status === 'pending')}
                                onClick={() => {/* TODO: handle withdraw */}}
                              >
                                Withdraw
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payouts</h3>
                {/* Filter buttons for payout status */}
                <div className="flex gap-2 mb-4">
                  <button
                    className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${payoutStatusFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                    onClick={() => setPayoutStatusFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${payoutStatusFilter === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                    onClick={() => setPayoutStatusFilter('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`px-3 py-1 text-sm font-semibold rounded transition-all duration-150 focus:outline-none ${payoutStatusFilter === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                    onClick={() => setPayoutStatusFilter('completed')}
                  >
                    Completed
                  </button>
                </div>
                {/* Payouts Table */}
                <div className="overflow-x-auto">
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
                        .filter(p => {
                          if (payoutStatusFilter === 'all') return true;
                          if (payoutStatusFilter === 'pending') return p.status.toLowerCase() === 'pending';
                          if (payoutStatusFilter === 'completed') return p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed';
                          return true;
                        })
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2 font-medium text-gray-900">{p.id}</td>
                            <td className="px-4 py-2 text-gray-700">₦{p.amount}</td>
                            <td className="px-4 py-2 text-gray-700">{p.date}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">{p.method}</td>
                            <td className="px-4 py-2 text-gray-700">{p.reference}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {commissionPayouts.filter(p => {
                    if (payoutStatusFilter === 'all') return true;
                    if (payoutStatusFilter === 'pending') return p.status.toLowerCase() === 'pending';
                    if (payoutStatusFilter === 'completed') return p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed';
                    return true;
                  }).length === 0 && (
                    <div className="text-center text-gray-500 py-8">No payouts found.</div>
                  )}
                </div>
              </>
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