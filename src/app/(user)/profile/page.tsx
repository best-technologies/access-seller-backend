"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  User,
  BookOpen,
  Heart,
  Settings,
  DollarSign,
  Copy
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileOrders from "@/components/profile/ProfileOrders";
import ProfileWishlist from "@/components/profile/ProfileWishlist";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ReferralEarnings from "@/components/profile/ReferralEarnings";

// Mock user data - replace with actual user data from your backend
const userData = {
  name: "Mayowa Steve",
  email: "bernardmayowaa@gmail.com",
  phone: "+2348146694787",
  address: "123 Book Street, Reading City, RC 12345",
  joinDate: "March 2024",
  avatar: "/images/icons/media.svg",
  stats: {
    orders: 12,
    wishlist: 8,
    reviews: 5
  },
  referralCode: "MAYOWA2024",
  referralLink: "https://accesssellr.com/ref/MAYOWA2024"
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState<{ type: null | "code" | "link" }>({ type: null });

  const handleCopy = (value: string, type: "code" | "link") => {
    navigator.clipboard.writeText(value);
    setCopied({ type });
    setTimeout(() => setCopied({ type: null }), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="My Profile" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-8">
          Manage your account settings and preferences
        </p>

        {/* Referral Link & Code Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-start md:items-center bg-white border border-indigo-100 rounded-xl shadow-sm p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Referral Link</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-700 text-sm bg-indigo-50 px-2 py-1 rounded-lg select-all">
                  {userData.referralLink}
                </span>
                <button
                  onClick={() => handleCopy(userData.referralLink, "link")}
                  className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
                  title="Copy referral link"
                >
                  <Copy className="h-4 w-4 text-indigo-600" />
                </button>
                {copied.type === "link" && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">Copied!</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Referral Code</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-700 text-sm bg-indigo-50 px-2 py-1 rounded-lg select-all">
                  {userData.referralCode}
                </span>
                <button
                  onClick={() => handleCopy(userData.referralCode, "code")}
                  className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
                  title="Copy referral code"
                >
                  <Copy className="h-4 w-4 text-indigo-600" />
                </button>
                {copied.type === "code" && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">Copied!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                <Image
                  src={userData.avatar}
                  alt={`${userData.name}'s profile picture`}
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover mb-4"
                />
                <h2 className="text-lg font-semibold text-gray-900">{userData.name}</h2>
                <p className="text-sm text-gray-500">Member since {userData.joinDate}</p>
              </div>

              <nav className="mt-8 space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === "profile"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-5 w-5" />
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab("referrals")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === "referrals"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  Referral Earnings
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === "orders"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === "wishlist"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  Wishlist
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === "settings"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && <ProfileInfo userData={userData} />}
            {activeTab === "referrals" && <ReferralEarnings />}
            {activeTab === "orders" && <ProfileOrders />}
            {activeTab === "wishlist" && <ProfileWishlist />}
            {activeTab === "settings" && <ProfileSettings />}
          </div>
        </div>
      </div>
    </div>
  );
} 