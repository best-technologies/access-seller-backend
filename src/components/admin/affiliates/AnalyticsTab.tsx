import { MapPin, TrendingUp, BarChart3, PieChart } from "lucide-react";
import type { AffiliateAnalytics } from '@/types/admin/dashboard/dashboard';

interface AnalyticsTabProps {
  analytics: AffiliateAnalytics;
}

export default function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics Overview</h3>
        <ul className="space-y-2">
          <li><strong>Conversion Rate:</strong> {analytics.conversionRate}%</li>
          <li><strong>Average Order Value:</strong> ₦{analytics.averageOrderValue.toLocaleString()}</li>
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Sources</h3>
        <ul className="space-y-2">
          {analytics.topSources.map((source) => (
            <li key={source.source}>
              <strong>{source.source}:</strong> {source.clicks} clicks, {source.conversions} conversions
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Geo Distribution</h3>
        <ul className="space-y-2">
          {analytics.geoDistribution.map((geo) => (
            <li key={geo.country}>
              <strong>{geo.country}:</strong> {geo.clicks} clicks, {geo.conversions} conversions
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 