"use client";

import { useEffect, useState } from "react";
import type { User } from '@/services/api';
import { 
  BookOpen,
  Heart,
  Settings,
  DollarSign,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileOrders from "@/components/profile/ProfileOrders";
import ProfileWishlist from "@/components/profile/ProfileWishlist";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ReferralEarnings from "@/components/profile/ReferralEarnings";
import { api } from "@/services/api";
import Loader from "@/components/Loader";

export default function ProfilePage() {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [affiliateDashboard, setAffiliateDashboard] = useState<Record<string, unknown> | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sidebar navigation items
  const sidebarItems = [
    { key: "profile", label: "Profile Information", icon: UserIcon },
    { key: "referrals", label: "Affiliate", icon: DollarSign },
    { key: "orders", label: "My Orders", icon: BookOpen },
    { key: "wishlist", label: "Wishlist", icon: Heart },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.user.getProfile();
        setUserData(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "referrals" && !affiliateDashboard && !affiliateLoading) {
      setAffiliateLoading(true);
      setAffiliateError(null);
      api.user.getAffiliateDashboard()
        .then((res) => setAffiliateDashboard(res.data))
        .catch((err) => setAffiliateError(err.message || "Failed to load affiliate dashboard"))
        .finally(() => setAffiliateLoading(false));
    }
  }, [activeTab, affiliateDashboard, affiliateLoading]);

  if (loading) return <Loader/>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!userData) return null;

  // Map userData to the expected structure for ProfileInfo and sidebar
  const mappedUserData = {
    name: `${userData.first_name} ${userData.last_name}`,
    email: userData.email,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            phone: (userData as { phone_number?: string }).phone_number || "",
    address: (userData as { address?: string }).address || "",
    joinDate: (userData as { joined_date?: string }).joined_date || "",
    avatar: userData.profile_picture || "/images/icons/media.svg",
    stats: {
      orders: (userData as { stats?: { totalOrders?: number } }).stats?.totalOrders ?? 0,
      wishlist: 0,
      reviews: 0,
    },
    referralCode: (userData as { referralCode?: string }).referralCode || "",
    referralLink: (userData as { referralLink?: string }).referralLink || ""
  };

  if (activeTab === "referrals") {
    console.log("affiliateDashboard in parent:", affiliateDashboard);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / App Name */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <span className="text-xl font-bold text-indigo-600">My Profile</span>
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm lg:hidden"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Main Content */}
      <main className="flex-1 min-h-screen transition-all lg:ml-64">
        <div className="p-8">
          {/* Professional Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
            <img
              src={mappedUserData.avatar}
              alt={mappedUserData.name}
              className="w-24 h-24 rounded-full border-4 border-indigo-100 object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{mappedUserData.name}</h2>
              <p className="text-gray-500">{mappedUserData.email}</p>
              <div className="flex gap-6 mt-4">
                {/* <div>
                  <span className="block text-lg font-semibold text-indigo-600">{mappedUserData.stats.orders}</span>
                  <span className="text-xs text-gray-400">Orders</span>
                </div> */}
                {/* <div>
                  <span className="block text-lg font-semibold text-indigo-600">{mappedUserData.stats.wishlist}</span>
                  <span className="text-xs text-gray-400">Wishlist</span>
                </div> */}
                {/* <div>
                  <span className="block text-lg font-semibold text-indigo-600">{mappedUserData.stats.reviews}</span>
                  <span className="text-xs text-gray-400">Reviews</span>
                </div> */}
              </div>
            </div>
          </div>
          {/* Main Content Tabs */}
          {activeTab === "profile" && <ProfileInfo userData={mappedUserData} />}
          {activeTab === "referrals" && (
            affiliateLoading ? (
              <Loader/>
            ) : affiliateError ? (
              <div className="min-h-[200px] flex items-center justify-center text-red-500">{affiliateError}</div>
            ) : affiliateDashboard ? (
              <ReferralEarnings 
                affiliateDashboard={affiliateDashboard} 
                refreshAffiliateDashboard={() => {
                  setAffiliateLoading(true);
                  setAffiliateError(null);
                  api.user.getAffiliateDashboard()
                    .then((res) => setAffiliateDashboard(res.data))
                    .catch((err) => setAffiliateError(err.message || "Failed to load affiliate dashboard"))
                    .finally(() => setAffiliateLoading(false));
                }}
              />
            ) : null
          )}
          {activeTab === "orders" && <ProfileOrders />}
          {activeTab === "wishlist" && <ProfileWishlist />}
          {activeTab === "settings" && <ProfileSettings />}
        </div>
      </main>
    </div>
  );
} 