import { BarChart3 } from "lucide-react";
import type { AffiliateOverview } from '@/types/admin/dashboard/dashboard';

interface OverviewTabProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  overview: AffiliateOverview;
}

export default function OverviewTab({ timeframe, onTimeframeChange, overview }: OverviewTabProps) {
  

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Affiliate Performance</h3>
            <div className="flex items-center gap-2">
              <select 
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {overview.timeframes.map((tf) => (
                  <option key={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Performance chart will be rendered here</p>
              <p className="text-sm text-gray-400">Chart.js or Recharts integration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Affiliates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Overview Summary</h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2">
            <li><strong>Revenue:</strong> ₦{overview.summary.revenue.toLocaleString()}</li>
            <li><strong>Clicks:</strong> {overview.summary.clicks}</li>
            <li><strong>Conversions:</strong> {overview.summary.conversions}</li>
            <li><strong>New Affiliates:</strong> {overview.summary.newAffiliates}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 