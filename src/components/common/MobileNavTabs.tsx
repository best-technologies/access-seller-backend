import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Search, ShoppingCart, User, DollarSign, BookOpen, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function MobileNavTabs() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper to determine if a tab is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Profile-specific tabs
  const profileTabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "referrals", label: "Affiliate", icon: DollarSign },
    { key: "orders", label: "Orders", icon: BookOpen },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  // If on /profile, show profile-specific nav
  if (pathname.startsWith("/profile")) {
    const activeTab = searchParams.get("tab") || "profile";
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg flex justify-around items-center h-16 md:hidden">
        {profileTabs.map(tab => {
          const Icon = tab.icon;
          const isTabActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/profile?tab=${tab.key}`)}
              className={`flex flex-col items-center justify-center flex-1 ${isTabActive ? "text-indigo-600" : "text-gray-600"}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Default global nav
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg flex justify-around items-center h-16 md:hidden">
      <Link href="/" className={`flex flex-col items-center justify-center ${isActive("/") ? "text-indigo-600" : "text-gray-600"}`}> 
        <Home className="w-6 h-6" />
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/products" className={`flex flex-col items-center justify-center ${isActive("/products") ? "text-indigo-600" : "text-gray-600"}`}>
        <Search className="w-6 h-6" />
        <span className="text-xs">Browse</span>
      </Link>
      <Link href="/cart" className={`relative flex flex-col items-center justify-center ${isActive("/cart") ? "text-indigo-600" : "text-gray-600"}`}>
        <ShoppingCart className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span className="text-xs">Cart</span>
      </Link>
      {isLoading ? null : isAuthenticated && user ? (
        <button
          onClick={() => {
            if (!pathname.startsWith('/profile')) {
              localStorage.setItem('lastNonProfileRoute', pathname);
            }
            router.push('/profile');
          }}
          className={`flex flex-col items-center justify-center ${isActive("/profile") ? "text-indigo-600" : "text-gray-600"}`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </button>
      ) : (
        <Link href="/auth/login" className={`flex flex-col items-center justify-center ${isActive("/auth/login") ? "text-indigo-600" : "text-gray-600"}`}>
          <User className="w-6 h-6" />
          <span className="text-xs">Sign In</span>
        </Link>
      )}
    </nav>
  );
} 