import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import Loader from '@/components/Loader';
import { MoreVertical } from 'lucide-react';
import { ActionMenu } from './AllAffiliatesTab';

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function PendingAffiliatesTab() {
  const [page, setPage] = useState(1);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.admin.getAllAffiliates(page, 20, 'pending')
      .then(response => {
        const data = response.data;
        setAffiliates(data.affiliates || []);
        setTotal(data.total || 0);
      })
      .catch(err => setError(err.message || 'Failed to fetch affiliates'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 5));

  if (loading) return <Loader title="Loading Pending Affiliates" message="Fetching pending approval affiliates..." />;
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
                <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No pending affiliates found.</td>
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
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700`}
                    >
                      Pending
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