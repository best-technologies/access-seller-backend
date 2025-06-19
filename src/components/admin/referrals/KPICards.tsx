import {
  Users,
  Target,
  DollarSign,
  Wallet,
  Clock,
  AlertCircle,
  Crown,
  Star,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { referralAnalytics, topReferrers } from "@/data/admin/referrals/mockData";

export default function KPICards() {
  // Calculate KPIs
  const kpis = {
    totalReferredUsers: referralAnalytics.length,
    totalReferralOrders: referralAnalytics.filter(r => r.status === "Completed").length,
    totalRevenue: referralAnalytics.reduce((sum, r) => sum + (r.orderAmount || 0), 0),
    totalCommissionsPaid: referralAnalytics.reduce((sum, r) => sum + (r.rewardStatus === "Paid" ? r.reward : 0), 0),
    pendingCommissions: referralAnalytics.reduce((sum, r) => sum + (r.rewardStatus === "Pending" ? r.reward : 0), 0),
    topReferrer: topReferrers[0]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Referred Users</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.totalReferredUsers}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-blue-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+12% this month</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Referral Orders</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.totalReferralOrders}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <Target className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+8% this month</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border border-purple-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">₦{kpis.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-purple-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+15% this month</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-600 font-medium">Commissions Paid</p>
            <p className="text-2xl font-semibold text-gray-900">₦{kpis.totalCommissionsPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-lg">
            <Wallet className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-amber-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Processed</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 font-medium">Pending Commissions</p>
            <p className="text-2xl font-semibold text-gray-900">₦{kpis.pendingCommissions.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Awaiting payout</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border border-yellow-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600 font-medium">Top Referrer</p>
            <p className="text-lg font-semibold text-gray-900">{kpis.topReferrer.name}</p>
            <p className="text-xs text-yellow-600">{kpis.topReferrer.referralCode}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Crown className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-yellow-600">
          <Star className="h-4 w-4 mr-1" />
          <span>₦{kpis.topReferrer.commission.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
} 