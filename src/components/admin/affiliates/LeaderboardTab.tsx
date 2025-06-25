import { Search, Download, User, Crown, Eye, Wallet, Share2, Filter, Calendar, TrendingUp } from "lucide-react";
import type { AffiliateLeaderboardEntry } from '@/types/admin/dashboard/dashboard';

interface LeaderboardTabProps {
  searchQuery: string;
  timeframe: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onSortByChange: (sortBy: string) => void;
  leaderboard: AffiliateLeaderboardEntry[];
}

export default function LeaderboardTab({
  searchQuery,
  timeframe,
  sortBy,
  onSearchChange,
  onTimeframeChange,
  onSortByChange,
  leaderboard
}: LeaderboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Filter className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Leaderboard Filters</h2>
                <p className="text-xs text-gray-500">Search and filter top affiliates</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search affiliates by name or ID..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              />
            </div>

            {/* Timeframe Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select 
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort By Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TrendingUp className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="users">Sort by Users</option>
                <option value="commissions">Sort by Commissions</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-base font-bold text-gray-900">Top Affiliates Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue (₦)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.map((affiliate, idx) => (
                <tr
                  key={affiliate.id}
                  className={
                    idx % 2 === 0
                      ? 'bg-white hover:bg-blue-50 transition-colors duration-150'
                      : 'bg-gray-50 hover:bg-blue-50 transition-colors duration-150'
                  }
                >
                  <td className="px-6 py-3 flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold border text-xs">
                      {getInitials(affiliate.name)}
                    </span>
                    <span className="font-medium text-gray-900">{affiliate.name}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{affiliate.email}</td>
                  <td className="px-6 py-3 text-gray-700">₦{affiliate.revenue.toLocaleString()}</td>
                  <td className="px-6 py-3 text-gray-700">{affiliate.clicks}</td>
                  <td className="px-6 py-3 text-gray-700">{affiliate.conversions}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        affiliate.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : affiliate.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{new Date(affiliate.joinedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
} 