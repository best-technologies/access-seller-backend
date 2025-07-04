import { Zap, ChevronLeft, ChevronRight, MoreVertical, CheckCircle, Eye, Clock } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { api } from '@/services/api';
import type { AffiliatePayout } from '@/types/admin/dashboard/dashboard';

interface PayoutsTabProps {
  payouts?: AffiliatePayout[];
}

type PayoutStatus = 'all' | 'pending' | 'completed' | 'rejected' | 'cancelled';

// interface PayoutsResponse {
//   success: boolean;
//   message: string;
//   data: {
//   payouts: AffiliatePayout[];
//     pagination: {
//       currentPage: number;
//       totalPages: number;
//       totalItems: number;
//       itemsPerPage: number;
//     };
//   };
// }

export default function PayoutsTab({ payouts: initialPayouts }: PayoutsTabProps) {
  const [activeTab, setActiveTab] = useState<PayoutStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>(initialPayouts || []);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApprovePayout = async (payoutId: string) => {
    try {
      // TODO: Implement API call to approve payout
      console.log('Approving payout:', payoutId);
      // Example: await api.admin.approvePayout(payoutId);
      
      // Close menu
      setOpenMenuId(null);
      
      // Refresh data if in viewAll mode
      if (viewAll) {
        fetchPayouts(currentPage, activeTab);
      }
    } catch (error) {
      console.error('Error approving payout:', error);
    }
  };

  const handleViewDetails = (payoutId: string) => {
    // TODO: Implement view details functionality
    console.log('Viewing details for payout:', payoutId);
    setOpenMenuId(null);
  };

  const handleViewPayoutDetails = (payout: AffiliatePayout) => {
    console.log('Opening modal for payout:', payout);
    setSelectedPayout(payout);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (payoutId: string) => {
    setOpenMenuId(openMenuId === payoutId ? null : payoutId);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    setSelectedPayout(null);
  };

  const fetchPayouts = async (page: number, status: PayoutStatus) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.getAffiliatePayouts(page, itemsPerPage, status);
      // Handle the response based on the actual structure
      if (response && typeof response === 'object') {
        const responseData = response as unknown as { success: boolean; message?: string; data?: { payouts?: AffiliatePayout[]; pagination?: { totalPages: number; totalItems: number } } };
        if (responseData.success && responseData.data) {
          setPayouts(responseData.data.payouts || []);
          setTotalPages(responseData.data.pagination?.totalPages || 1);
          setTotalItems(responseData.data.pagination?.totalItems || 0);
        } else {
          setError(responseData.message || 'Failed to fetch payouts');
        }
      } else {
        // Fallback for different response structure
        setError('Unexpected response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewAll) {
      fetchPayouts(currentPage, activeTab);
    }
  }, [currentPage, activeTab, viewAll]);

  const handleTabChange = (tab: PayoutStatus) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (viewAll) {
      fetchPayouts(1, tab);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getStatusCount = (status: PayoutStatus) => {
    if (!viewAll) {
      if (status === 'all') return initialPayouts?.length || 0;
      return initialPayouts?.filter(payout => payout.status.toLowerCase() === status).length || 0;
    }
    return totalItems;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs: { key: PayoutStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredPayouts = useMemo(() => {
    const displayPayouts = viewAll ? payouts : (initialPayouts || []);
    if (!viewAll) {
      if (activeTab === 'all') return displayPayouts;
      return displayPayouts.filter(payout => payout.status.toLowerCase() === activeTab);
    }
    return displayPayouts;
  }, [payouts, initialPayouts, activeTab, viewAll]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Commission Payout Status</h3>
            <div className="flex items-center gap-3">
              {!viewAll && (
                <button 
                  onClick={() => setViewAll(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  View All
                </button>
              )}
              {/* <button 
                onClick={() => {
                  console.log('Test modal button clicked');
                  setSelectedPayout({
                    payoutId: "test-123",
                    affiliateId: "test-affiliate",
                    affiliateName: "Test Affiliate",
                    amount: 50000,
                    status: "pending",
                    requestedAt: new Date().toISOString(),
                    paidAt: null,
                    accountDetails: {
                      bankName: "Test Bank",
                      accountNumber: "1234567890",
                      accountName: "Test Account Name",
                      bankCode: "001"
                    },
                    payoutMethod: "bank transfer",
                    withdrawalStatus: "pending"
                  });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                Test Modal
              </button> */}
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              <Zap className="h-4 w-4" />
              Initiate Bulk Payout
            </button>
          </div>
        </div>
        </div>

        {/* Subtabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({getStatusCount(tab.key)})
              </button>
            ))}
          </nav>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading payouts...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payouts found
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                <tr key={payout.payoutId} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">{payout.affiliateName}</td>
                  <td className="px-6 py-4">₦{payout.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                  <td className="px-6 py-4">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPayoutDetails(payout)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <div className="relative" ref={menuRef}>
                          <button
                            onClick={() => toggleMenu(payout.payoutId)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {openMenuId === payout.payoutId && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                {payout.status.toLowerCase() === 'pending' && (
                                  <button
                                    onClick={() => handleApprovePayout(payout.payoutId)}
                                    className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve Payout
                                  </button>
                                )}
                                
                                {payout.status.toLowerCase() === 'pending' && (
                                  <button
                                    onClick={() => handleViewDetails(payout.payoutId)}
                                    className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                                  >
                                    <Clock className="h-4 w-4" />
                                    Mark as Processing
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {viewAll && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages} ({totalItems} total payouts)
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Debug: viewAll={viewAll.toString()}, totalPages={totalPages}, totalItems={totalItems}
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              {totalPages <= 1 && (
                <div className="text-sm text-gray-500">
                  No pagination needed
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payout Details Modal */}
      {isModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-10 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payout Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Basic Information</h4>
                  <div className="space-y-4">
                    {/* Payout ID */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Payout ID</label>
                          <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border border-gray-200">{selectedPayout.payoutId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Affiliate Name */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Affiliate Name</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedPayout.affiliateName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Amount</label>
                          <p className="text-2xl font-bold text-gray-900">₦{selectedPayout.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Status</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayout.status)}`}>
                            {selectedPayout.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Account Details</h4>
                  {selectedPayout.accountDetails ? (
                    <div className="space-y-4">
                      {/* Bank Name */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Bank Name</label>
                            <p className="text-sm text-gray-900 font-medium">{selectedPayout.accountDetails.bankName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Account Number</label>
                            <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border border-gray-200">{selectedPayout.accountDetails.accountNumber}</p>
                          </div>
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Account Name</label>
                            <p className="text-sm text-gray-900">{selectedPayout.accountDetails.accountName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bank Code */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Bank Code</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedPayout.accountDetails.bankCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payout Method */}
                      {selectedPayout.payoutMethod && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Payout Method</label>
                              <p className="text-sm text-gray-900 bg-white px-3 py-1 rounded border border-gray-200 font-medium">{selectedPayout.payoutMethod}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-red-900 font-medium">No account details available</p>
                          <p className="text-xs text-red-700">Please add banking information to proceed</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-8 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Timeline</h4>
                <div className="space-y-4">
                  {/* Payout Requested */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">Payout Requested</p>
                        <p className="text-xs text-gray-600">{new Date(selectedPayout.requestedAt).toLocaleString()}</p>
                      </div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Payout Completed */}
                  {selectedPayout.paidAt && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">Payout Completed</p>
                          <p className="text-xs text-gray-600">{new Date(selectedPayout.paidAt).toLocaleString()}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  )}

                  {/* Processing Status (if pending) */}
                  {selectedPayout.status.toLowerCase() === 'pending' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">Processing</p>
                          <p className="text-xs text-gray-600">Awaiting approval and processing</p>
                        </div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedPayout.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={() => {
                      handleApprovePayout(selectedPayout.payoutId);
                      closeModal();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Payout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 