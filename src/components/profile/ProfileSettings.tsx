import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Users, Package, Tag, BarChart3, Bell, Lock, CreditCard, ChevronRight, Settings as SettingsIcon } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {isAdmin && (
        <div className="mb-8 p-6 bg-indigo-50 border border-indigo-200 rounded-xl shadow flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">Admin Capabilities</h3>
          </div>
          <ul className="list-none space-y-2 text-indigo-900 text-sm">
            <li className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /> Manage customers and user accounts</li>
            <li className="flex items-center gap-2"><Package className="h-4 w-4 text-indigo-500" /> Manage products and inventory</li>
            <li className="flex items-center gap-2"><Tag className="h-4 w-4 text-indigo-500" /> Create and manage discounts, promo codes, and referral commissions</li>
            <li className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-500" /> Access analytics, reports, and dashboards</li>
            <li className="flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-indigo-500" /> Configure system and store settings</li>
            <li className="flex items-center gap-2"><Bell className="h-4 w-4 text-indigo-500" /> Manage notifications and communication</li>
          </ul>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
      <div className="space-y-4">
        <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Notification Preferences</p>
              <p className="text-sm text-gray-500">Manage your notification settings</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
        <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Privacy Settings</p>
              <p className="text-sm text-gray-500">Manage your privacy preferences</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
        <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Payment Methods</p>
              <p className="text-sm text-gray-500">Manage your payment information</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
} 