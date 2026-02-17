"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  BookOpen,
  Heart,
  Settings,
  DollarSign,
  X,
  User as UserIcon,
  ArrowLeft
} from "lucide-react";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileOrders from "@/components/profile/ProfileOrders";
import ProfileWishlist from "@/components/profile/ProfileWishlist";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ReferralEarnings from "@/components/profile/ReferralEarnings";
import { api } from "@/services/api";
import Loader from "@/components/Loader";
import Image from 'next/image';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function ProfilePage() {
  const { user: userData, isLoading: loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const searchParams = useSearchParams();
  const [affiliateDashboard, setAffiliateDashboard] = useState<Record<string, unknown> | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open
  const [refreshKey, setRefreshKey] = useState(0);

  // Always open sidebar on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Sidebar navigation items
  const sidebarItems = [
    { key: "profile", label: "Profile Information", icon: UserIcon, shortLabel: "Profile" },
    { key: "referrals", label: "Affiliate", icon: DollarSign, shortLabel: "Affiliate" },
    { key: "orders", label: "My Orders", icon: BookOpen, shortLabel: "Orders" },
    { key: "wishlist", label: "Wishlist", icon: Heart, shortLabel: "Wishlist" },
    { key: "settings", label: "Settings", icon: Settings, shortLabel: "Settings" },
  ];

  // Set active tab from query param on mount
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && ["profile", "referrals", "orders", "wishlist", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Remove the useEffect that toggles sidebar open/close on resize

  useEffect(() => {
    if (activeTab === "referrals") {
      setAffiliateLoading(true);
      setAffiliateError(null);

      // Caching logic
      const CACHE_KEY = 'affiliate_dashboard_cache';
      const CACHE_TIME_KEY = 'affiliate_dashboard_cache_time';
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
      const now = Date.now();
      const cache = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
      const cacheTime = typeof window !== 'undefined' ? localStorage.getItem(CACHE_TIME_KEY) : null;

      if (cache && cacheTime && now - parseInt(cacheTime) < CACHE_DURATION) {
        setAffiliateDashboard(JSON.parse(cache));
        setAffiliateLoading(false);
      } else {
        api.user.getAffiliateDashboard()
        .then((res) => {
          setAffiliateDashboard(res.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
          }
        })
        .catch((err) => setAffiliateError(err.message || "Failed to load affiliate dashboard"))
        .finally(() => setAffiliateLoading(false));
      }
    }
  }, [activeTab, refreshKey]);

  if (loading) return <Loader/>;
  if (!userData && !loading) return <div className="min-h-screen flex items-center justify-center text-red-500 px-4">Failed to load profile</div>;
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
    // console.log("affiliateDashboard in parent:", affiliateDashboard);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const lastRoute = typeof window !== 'undefined' ? localStorage.getItem('lastNonProfileRoute') : null;
                if (lastRoute && !lastRoute.startsWith('/profile')) {
                  window.location.href = lastRoute;
                } else {
                  window.location.href = '/';
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Profile
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={mappedUserData.avatar}
              alt={mappedUserData.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border-2 border-indigo-100 object-cover"
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Remove this section completely */}

      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        className={`hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:z-40 lg:h-screen lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:transition-transform lg:duration-300 ${
          isSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / App Name */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              My Profile
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around items-center">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-0 ${
                activeTab === item.key 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 pb-20 lg:pb-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <div className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8">
          {/* Profile Header - Improved mobile layout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative">
                <Image
                  src={mappedUserData.avatar}
                  alt={mappedUserData.name}
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-4 border-indigo-100 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {mappedUserData.name}
                </h2>
                <p className="text-gray-500 text-sm sm:text-base mb-3">
                  {mappedUserData.email}
                </p>
                
                {/* Stats - Horizontal scroll on mobile */}
                <div className="flex gap-4 sm:gap-6 justify-center sm:justify-start overflow-x-auto">
                  <div className="flex flex-col items-center min-w-0">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {mappedUserData.stats.orders}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">Orders</span>
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {mappedUserData.stats.wishlist}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">Wishlist</span>
                  </div>
                  <div className="flex flex-col items-center min-w-0">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {mappedUserData.stats.reviews}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content - Add proper mobile padding */}
          <div className="space-y-6">
            {activeTab === "profile" && <ProfileInfo userData={mappedUserData} />}
            {activeTab === "referrals" && (
              affiliateLoading ? (
                <div className="min-h-[200px] flex items-center justify-center">
                  <Loader/>
                </div>
              ) : affiliateError ? (
                <div className="min-h-[200px] flex items-center justify-center text-red-500 text-center px-4">
                  {affiliateError}
                </div>
              ) : affiliateDashboard ? (
                <ReferralEarnings 
                  affiliateDashboard={affiliateDashboard} 
                  refreshAffiliateDashboard={() => setRefreshKey(k => k + 1)}
                />
              ) : null
            )}
            {activeTab === "orders" && <ProfileOrders />}
            {activeTab === "wishlist" && <ProfileWishlist />}
            {activeTab === "settings" && <ProfileSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ProfilePage />
    </Suspense>
  );
}