import { Zap } from "lucide-react";
import type { AffiliatePayout } from '@/types/admin/dashboard/dashboard';

interface PayoutsTabProps {
  payouts: AffiliatePayout[];
}

export default function PayoutsTab({ payouts }: PayoutsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Commission Payout Status</h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              <Zap className="h-4 w-4" />
              Initiate Bulk Payout
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.payoutId} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">{payout.affiliateName}</td>
                  <td className="px-6 py-4">₦{payout.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{payout.status}</td>
                  <td className="px-6 py-4">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 