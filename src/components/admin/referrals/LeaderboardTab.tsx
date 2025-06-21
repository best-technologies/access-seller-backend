import { Search, Download, User, Crown, Eye, Wallet, Share2, Filter, Calendar, TrendingUp } from "lucide-react";
import { topReferrers } from "@/data/admin/referrals/mockData";

interface LeaderboardTabProps {
  searchQuery: string;
  timeframe: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onSortByChange: (sortBy: string) => void;
}

export default function LeaderboardTab({
  searchQuery,
  timeframe,
  sortBy,
  onSearchChange,
  onTimeframeChange,
  onSortByChange
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
                <p className="text-xs text-gray-500">Search and filter top referrers</p>
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
                placeholder="Search referrers by name or ID..."
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-base font-bold text-gray-900">Top Referrers Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    Rank
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Referrer
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5" />
                    Code/Link
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Referred Users
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Referral Orders
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Revenue
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Commission
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {topReferrers.map((referrer) => (
                <tr key={referrer.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {referrer.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 ${
                          referrer.rank === 1 ? 'bg-gradient-to-br from-yellow-200 to-yellow-50' : 
                          referrer.rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-50' : 'bg-gradient-to-br from-orange-200 to-orange-50'
                        }`}>
                          <Crown className={`h-4 w-4 ${
                            referrer.rank === 1 ? 'text-yellow-600' : 
                            referrer.rank === 2 ? 'text-gray-600' : 'text-orange-600'
                          }`} />
                        </div>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {referrer.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{referrer.name}</div>
                        <div className="text-xs text-gray-500">ID: {referrer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{referrer.referralCode}</code>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 group-hover:scale-110">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{referrer.referredUsers}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{referrer.referralOrders}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">₦{referrer.revenueGenerated.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-green-600">₦{referrer.commission.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:scale-110" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group-hover:scale-110" title="Payouts">
                        <Wallet className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 