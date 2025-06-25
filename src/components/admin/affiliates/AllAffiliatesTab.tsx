import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import Loader from '@/components/Loader';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: string;
  avatarUrl?: string;
  category?: string;
  requestedAt?: string;
  reason?: string;
  user?: {
    phone_number?: string;
  };
  notes?: string;
  [key: string]: any;
}

interface AffiliatesResponse {
  success: boolean;
  data: {
    affiliates: Affiliate[];
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function AllAffiliatesTab() {
  const [page, setPage] = useState(1);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.admin.getAllAffiliates(page, 20)
      .then(response => {
        const data = response.data;
        setAffiliates(data.affiliates || []);
        setTotal(data.total || 0);
      })
      .catch(err => setError(err.message || 'Failed to fetch affiliates'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 5));

  if (loading) return <Loader title="Loading Affiliates" message="Fetching all affiliates..." />;
  if (error) return <div className="py-10 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Affiliate</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Requested At</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No affiliates found.</td>
              </tr>
            ) : (
              affiliates.map((a, idx) => (
                <tr
                  key={a.id}
                  className={
                    idx % 2 === 0
                      ? 'bg-white hover:bg-blue-50 transition-colors duration-150'
                      : 'bg-gray-50 hover:bg-blue-50 transition-colors duration-150'
                  }
                >
                  <td className="px-6 py-3 flex items-center gap-3">
                    {a.avatarUrl ? (
                      <img src={a.avatarUrl} alt={a.name} className="h-8 w-8 rounded-full object-cover border" />
                    ) : (
                      <span className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold border text-xs">
                        {getInitials(a.name)}
                      </span>
                    )}
                    <span className="font-medium text-gray-900">{a.name}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{a.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        a.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{a.category || '-'}</td>
                  <td className="px-6 py-3 text-gray-700">{a.requestedAt ? new Date(a.requestedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-3 text-gray-700">{a.reason || '-'}</td>
                  <td className="px-6 py-3 text-gray-700">{a.user?.phone_number || '-'}</td>
                  <td className="px-6 py-3 text-gray-700 relative">
                    <ActionMenu affiliate={a} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ActionMenu({ affiliate }: { affiliate: Affiliate }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(affiliate.status);
  const [loading, setLoading] = useState(false);

  const allowedStatuses = [
    'not_affiliate',
    'awaiting_approval',
    'pending',
    'approved',
    'rejected',
    'active',
    'inactive',
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      // Calculate menu position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyles({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.right - 180, // 180px is menu width
          zIndex: 9999,
          minWidth: 180,
        });
      }
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleEditStatus = () => {
    setShowEditModal(true);
    setOpen(false);
  };

  const handleProceed = async () => {
    setLoading(true);
    try {
      await api.admin.updateAffiliateStatus(affiliate.id, selectedStatus);
      toast.success('Affiliate status updated successfully.');
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-gray-100 transition"
        title="Actions"
      >
        <MoreVertical className="h-5 w-5 text-gray-500" />
      </button>
      {open && typeof window !== 'undefined' && createPortal(
        <div ref={menuRef} style={menuStyles} className="z-50 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Affiliate Records</button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={handleEditStatus}>Edit Status</button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</button>
            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Remove Affiliate</button>
          </div>
        </div>,
        document.body
      )}
      {showEditModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 animate-fadeIn pointer-events-auto">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none text-xl"
              onClick={() => setShowEditModal(false)}
              aria-label="Close modal"
              disabled={loading}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Edit Affiliate Status</h2>
            <p className="text-sm text-gray-600 mb-4">Select a new status for <span className="font-semibold">{affiliate.name}</span> and click proceed.</p>
            {/* Current Status Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mr-2 ${
                affiliate.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : affiliate.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : affiliate.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                Current: {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1).replace(/_/g, ' ')}
              </span>
            </div>
            <label className="block mb-2 text-sm font-medium text-gray-700">New Status</label>
            <div className="relative mb-6">
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-gray-900 font-medium"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                disabled={loading}
              >
                {allowedStatuses.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                onClick={() => setShowEditModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                onClick={handleProceed}
                disabled={loading || selectedStatus === affiliate.status}
              >
                Proceed
              </button>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-2xl">
                <Loader title="Updating Status" message="Please wait while we update the affiliate's status..." />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 