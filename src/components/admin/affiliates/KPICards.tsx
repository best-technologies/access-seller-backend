import {
  Users,
  DollarSign,
  Wallet,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import type { AffiliateKPICards } from '@/types/admin/dashboard/dashboard';

interface KPICardsProps {
  kpiCards: AffiliateKPICards;
}

export default function KPICards({ kpiCards }: KPICardsProps) {
  // Use the kpiCards prop directly
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-100 p-4 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-medium">Total Affiliates</p>
            <p className="text-xl font-bold text-gray-900">{kpiCards.totalAffiliates}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-md">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="mt-1 flex items-center text-xs text-blue-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+12% this month</span>
        </div>
      </div>
      {/* <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow border border-green-100 p-4 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-medium">Total Clicks</p>
            <p className="text-xl font-bold text-gray-900">{kpiCards.totalClicks}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-md">
            <Target className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="mt-1 flex items-center text-xs text-green-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+8% this month</span>
        </div>
      </div> */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow border border-purple-100 p-4 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-600 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">₦{kpiCards.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-md">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <div className="mt-1 flex items-center text-xs text-purple-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+15% this month</span>
        </div>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow border border-amber-100 p-4 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 font-medium">Total Conversions</p>
            <p className="text-xl font-bold text-gray-900">{kpiCards.totalConversions}</p>
          </div>
          <div className="p-2 bg-amber-100 rounded-md">
            <Wallet className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <div className="mt-1 flex items-center text-xs text-amber-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span>Processed</span>
        </div>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow border border-red-100 p-4 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-red-600 font-medium">Pending Payouts</p>
            <p className="text-xl font-bold text-gray-900">₦{kpiCards.pendingPayouts.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-red-100 rounded-md">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
        </div>
        <div className="mt-1 flex items-center text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>Awaiting payout</span>
        </div>
      </div>
      {/* You can add more cards as needed */}
    </div>
  );
} 