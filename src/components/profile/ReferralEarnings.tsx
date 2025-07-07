"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign, Users, Copy, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";
import Image from "next/image";
import InlineSpinner from "@/components/profile/InlineSpinner";
import { useRouter } from 'next/navigation';

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
  id: string;
  orderId: string;
  displayImage?: string;
  buyerName?: string;
  buyerEmail?: string;
  orderAmount?: number;
  commissionEarned?: number;
  orderDate?: string;
  status?: string;
  approved?: boolean;
  withdrawalStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
  commissionId?: string;
};

export default function ReferralEarnings({ affiliateDashboard, refreshAffiliateDashboard }: ReferralEarningsProps) {
  const router = useRouter();
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
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [expandedBankIdx, setExpandedBankIdx] = useState<number | null>(null);
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<UserBank | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawOrder, setSelectedWithdrawOrder] = useState<TableAnalysisRow | null>(null);
  const [selectedWithdrawBank, setSelectedWithdrawBank] = useState<string>("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

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
  }, [activeTab, affiliateLinks.length]);

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

  // Use real payouts data from affiliateDashboard
  type Payout = {
    id: string;
    payoutId?: string;
    amount: number;
    date: string;
    status: string;
    method?: string;
    reference?: string;
  };
  const payouts: Payout[] = Array.isArray((data as unknown as { payouts?: Payout[] }).payouts)
    ? (data as unknown as { payouts: Payout[] }).payouts
    : [];

  // Bank list state and cache logic
  const [banks, setBanks] = useState<{ id: number; name: string; code: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  // Use real banks data from affiliateDashboard
  type UserBank = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    id?: string; // Add optional id field in case backend provides it
  };
  const userBanks: UserBank[] = Array.isArray((data as unknown as { banks?: UserBank[] }).banks)
    ? (data as unknown as { banks: UserBank[] }).banks
    : [];
  const maxAccounts = 2;
  const canAdd = userBanks.length < maxAccounts;

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

  // Handle bank deletion
  const handleDeleteBank = async (bankId: string) => {
    if (!bankToDelete) return;
    
    setDeletingBankId(bankId);
    try {
      const res = await api.user.deleteBankAccount(bankId);
      if (res.success) {
        toast.success(res.message || 'Bank account deleted successfully!');
        // Refresh the affiliate dashboard to get updated bank list
        refreshAffiliateDashboard();
        setShowDeleteModal(false);
        setBankToDelete(null);
      } else {
        toast.error(res.message || 'Failed to delete bank account');
      }
    } catch (err: unknown) {
      let message = 'Failed to delete bank account';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      toast.error(message);
    } finally {
      setDeletingBankId(null);
    }
  };

  const openDeleteModal = (bank: UserBank) => {
    setBankToDelete(bank);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setBankToDelete(null);
  };

  // Handle withdrawal request
  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawOrder || !selectedWithdrawBank) return;
    
    setWithdrawSubmitting(true);
    try {
      const selectedBank = userBanks.find(bank => (bank.id || bank.bankCode) === selectedWithdrawBank);
      
      if (!selectedBank?.id) {
        toast.error('Invalid bank selection. Please try again.');
        return;
      }
      
      const withdrawalData = {
        orderId: selectedWithdrawOrder.id,
        bankCode: selectedBank.bankCode!
      };
      
      console.log('Withdrawal order:', selectedWithdrawOrder);
      console.log('Selected bank:', selectedBank);
      
      const res = await api.user.requestWithdrawal(withdrawalData);
      
      if (res.success) {
        toast.success(res.message || 'Withdrawal request submitted successfully!');
        setShowWithdrawModal(false);
        setSelectedWithdrawOrder(null);
        setSelectedWithdrawBank("");
        
        // Refresh the affiliate dashboard to get updated withdrawal status
        refreshAffiliateDashboard();
      } else {
        toast.error(res.message || 'Failed to submit withdrawal request');
      }
    } catch (err: unknown) {
      let message = 'Failed to submit withdrawal request';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      toast.error(message);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const openWithdrawModal = (order: TableAnalysisRow) => {
    setSelectedWithdrawOrder(order);
    setSelectedWithdrawBank("");
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSelectedWithdrawOrder(null);
    setSelectedWithdrawBank("");
  };

  // Helper function to get withdraw button state
  const getWithdrawButtonState = (order: TableAnalysisRow) => {
    const withdrawalStatus = order.withdrawalStatus || 'none';
    
    // If order status is inactive, always disable the withdraw button
    if (order.status === 'inactive') {
      return {
        text: 'Withdraw',
        disabled: true,
        className: 'bg-gray-200 text-gray-400 cursor-not-allowed'
      };
    }
    
    switch (withdrawalStatus) {
      case 'none':
        return {
          text: 'Withdraw',
          disabled: !(order.approved && order.status === 'pending'),
          className: 'bg-indigo-600 text-white hover:bg-indigo-700'
        };
      case 'pending':
        return {
          text: 'Processing...',
          disabled: true,
          className: 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
        };
      case 'processing':
        return {
          text: 'Processing...',
          disabled: true,
          className: 'bg-blue-100 text-blue-700 cursor-not-allowed'
        };
      case 'completed':
        return {
          text: 'Paid',
          disabled: true,
          className: 'bg-green-100 text-green-700 cursor-not-allowed'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          disabled: true,
          className: 'bg-red-100 text-red-700 cursor-not-allowed'
        };
      case 'failed':
        return {
          text: 'Failed',
          disabled: true,
          className: 'bg-red-100 text-red-700 cursor-not-allowed'
        };
      default:
        return {
          text: 'Withdraw',
          disabled: !(order.approved && order.status === 'pending'),
          className: 'bg-indigo-600 text-white hover:bg-indigo-700'
        };
    }
  };

  // Helper function to get withdrawal status badge styling
  const getWithdrawalStatusBadge = (withdrawalStatus: string | undefined) => {
    switch (withdrawalStatus) {
      case 'none':
        return {
          text: 'No Request',
          className: 'bg-gray-100 text-gray-600',
          icon: null,
          tooltip: 'No withdrawal request has been made for this commission'
        };
      case 'pending':
        return {
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-700',
          icon: <Clock className="w-3 h-3" />,
          tooltip: 'Withdrawal request submitted and awaiting approval'
        };
      case 'processing':
        return {
          text: 'Processing',
          className: 'bg-blue-100 text-blue-700',
          icon: <Clock className="w-3 h-3" />,
          tooltip: 'Withdrawal approved and being processed by bank'
        };
      case 'completed':
        return {
          text: 'Paid',
          className: 'bg-green-100 text-green-700',
          icon: <CheckCircle className="w-3 h-3" />,
          tooltip: 'Withdrawal successfully completed and paid out'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          className: 'bg-red-100 text-red-700',
          icon: <XCircle className="w-3 h-3" />,
          tooltip: 'Withdrawal request was rejected'
        };
      case 'failed':
        return {
          text: 'Failed',
          className: 'bg-red-100 text-red-700',
          icon: <AlertCircle className="w-3 h-3" />,
          tooltip: 'Bank transfer failed'
        };
      default:
        return {
          text: 'No Request',
          className: 'bg-gray-100 text-gray-600',
          icon: null,
          tooltip: 'No withdrawal request has been made for this commission'
        };
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
              {userBanks.length === 0 ? (
                <div className="text-gray-500 col-span-2">No bank accounts added yet.</div>
              ) : (
                userBanks.slice(0, 2).map((acc, idx) => {
                  const isExpanded = expandedBankIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`relative bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200 ${isExpanded ? 'ring-2 ring-indigo-200 bg-indigo-50' : 'hover:shadow-lg'}`}
                    >
                      <div className="flex items-center justify-between px-5 py-4">
                        <div
                          className="flex items-center justify-between flex-1 cursor-pointer select-none rounded-xl"
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedBankIdx(isExpanded ? null : idx)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') setExpandedBankIdx(isExpanded ? null : idx);
                          }}
                        >
                          <span className="font-semibold text-base text-gray-900 flex-1 text-left truncate">
                            {acc.bankName}
                          </span>
                          <span className="ml-3 flex items-center text-indigo-600">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </span>
                        </div>
                        <button
                          className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(acc);
                          }}
                          disabled={deletingBankId === (acc.id || acc.bankCode) || showDeleteModal}
                          title="Delete bank account"
                        >
                          {deletingBankId === (acc.id || acc.bankCode) ? (
                            <InlineSpinner size={16} />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div
                        className={`overflow-hidden transition-all duration-300 bg-white ${isExpanded ? 'max-h-40 opacity-100 py-2 px-5' : 'max-h-0 opacity-0 py-0 px-5'}`}
                        style={{ background: isExpanded ? 'rgba(255,255,255,0.95)' : undefined }}
                      >
                        {isExpanded && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Account Number:</span>
                              <span className="text-gray-800 font-mono tracking-wide">{acc.accountNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Account Name:</span>
                              <span className="text-gray-800">{acc.accountName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {idx < userBanks.slice(0, 2).length - 1 && (
                        <div className="absolute left-5 right-5 bottom-0 h-px bg-gray-200" style={{ zIndex: 1 }} />
                      )}
                    </div>
                  );
                })
              )}
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
            {/* Delete Confirmation Modal */}
            {showDeleteModal && bankToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Bank Account</h3>
                    <button
                      onClick={closeDeleteModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={deletingBankId === (bankToDelete.id || bankToDelete.bankCode)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-3">
                      Are you sure you want to delete this bank account?
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">
                            {bankToDelete.bankName}
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            Account: {bankToDelete.accountNumber}
                          </p>
                          <p className="text-sm text-red-700">
                            Name: {bankToDelete.accountName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                      disabled={deletingBankId === (bankToDelete.id || bankToDelete.bankCode)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteBank(bankToDelete.id || bankToDelete.bankCode)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={deletingBankId === (bankToDelete.id || bankToDelete.bankCode)}
                    >
                      {deletingBankId === (bankToDelete.id || bankToDelete.bankCode) ? (
                        <>
                          <InlineSpinner size={16} />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Withdrawal Modal */}
            {showWithdrawModal && selectedWithdrawOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Request Withdrawal</h3>
                    <button
                      onClick={closeWithdrawModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={withdrawSubmitting}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleWithdrawRequest} className="space-y-6">
                    {/* Commission Details */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-green-800">Available Commission</h4>
                          <p className="text-2xl font-bold text-green-600">₦{selectedWithdrawOrder.commissionEarned}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">Important Information</h4>
                          <div className="text-sm text-blue-700 mt-1 space-y-1">
                            <p>• You are about to request ₦{selectedWithdrawOrder.commissionEarned} for this commission</p>
                            <p>• Funds will be delivered to your selected bank account within 24 hours</p>
                            <p>• Processing time may vary depending on your bank</p>
                            <p>• You will receive a confirmation email once processed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bank Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Bank Account
                      </label>
                      {userBanks.length === 0 ? (
                        <div className="text-center py-4 border border-gray-200 rounded-lg">
                          <p className="text-gray-500 mb-2">No bank accounts available</p>
                          <button
                            type="button"
                            onClick={() => {
                              closeWithdrawModal();
                              openBankModal();
                            }}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Add a bank account first
                          </button>
                        </div>
                      ) : (
                        <select
                          value={selectedWithdrawBank}
                          onChange={(e) => setSelectedWithdrawBank(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          required
                        >
                          <option value="">Select a bank account</option>
                          {userBanks.map((bank, idx) => (
                            <option key={idx} value={bank.id || bank.bankCode}>
                              {bank.bankName} - {bank.accountNumber}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    {/* Selected Bank Details */}
                    {selectedWithdrawBank && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Selected Bank Details</h4>
                        {(() => {
                          const selectedBank = userBanks.find(bank => (bank.id || bank.bankCode) === selectedWithdrawBank);
                          if (!selectedBank) return null;
                          
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bank Name:</span>
                                <span className="font-medium text-gray-800">{selectedBank.bankName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Account Number:</span>
                                <span className="font-medium text-gray-800 font-mono">{selectedBank.accountNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Account Name:</span>
                                <span className="font-medium text-gray-800">{selectedBank.accountName}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeWithdrawModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                        disabled={withdrawSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={withdrawSubmitting || !selectedWithdrawBank || userBanks.length === 0}
                      >
                        {withdrawSubmitting ? (
                          <>
                            <InlineSpinner size={16} />
                            Processing...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </button>
                    </div>
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
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commission</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Withdrawal Status</th>
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
                            <td className="px-4 py-2">₦{order.orderAmount}</td>
                            <td className="px-4 py-2">₦{order.commissionEarned}</td>
                            <td className="px-4 py-2">{order.orderDate ? order.orderDate : ''}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'inactive' ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
                            </td>
                            <td className="px-4 py-2">
                              {(() => {
                                const statusBadge = getWithdrawalStatusBadge(order.withdrawalStatus);
                                return (
                                  <div className="group relative">
                                    <span 
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${statusBadge.className}`}
                                      title={statusBadge.tooltip}
                                    >
                                      {statusBadge.icon}
                                      {statusBadge.text}
                                    </span>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap transition-opacity duration-200">
                                      {statusBadge.tooltip}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-2">
                              {(() => {
                                const buttonState = getWithdrawButtonState(order);
                                return (
                                  <button
                                    className={`px-3 py-1 rounded font-semibold text-xs transition-colors focus:outline-none ${buttonState.className}`}
                                    disabled={buttonState.disabled}
                                    onClick={() => !buttonState.disabled && openWithdrawModal(order)}
                                  >
                                    {buttonState.text}
                                  </button>
                                );
                              })()}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Payouts</h3>
                {/* Filter buttons for payout status */}
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
                {/* Payouts Table */}
                {payouts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No payouts available at the moment.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payout ID</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {payouts
                        .filter(p =>
                          payoutTab === 'all'
                            ? true
                            : payoutTab === 'pending'
                            ? p.status.toLowerCase() === 'pending'
                            : p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed'
                        )
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2 font-medium text-gray-900">{p.payoutId || p.id}</td>
                            <td className="px-4 py-2 text-gray-700">₦{p.amount}</td>
                            <td className="px-4 py-2 text-gray-700">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : p.status.toLowerCase() === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
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
              onClick={() => router.push('/products')}
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
          {payouts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No payouts available at the moment.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payout ID</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payouts
                  .filter(p =>
                    payoutTab === 'all'
                      ? true
                      : payoutTab === 'pending'
                      ? p.status.toLowerCase() === 'pending'
                      : p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed'
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{p.payoutId || p.id}</td>
                      <td className="px-4 py-2 text-gray-700">₦{p.amount}</td>
                      <td className="px-4 py-2 text-gray-700">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : p.status.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
} 