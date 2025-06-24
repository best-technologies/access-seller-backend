"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import MiniCartPreview from "@/components/home/MiniCartPreview";
import {
  User,
  ChevronDown,
  LogIn,
  LogOut,
  UserPlus,
  Package,
  Settings,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GeneralNavbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const successMessage = await logout();
      setIsUserMenuOpen(false);
      toast.success(successMessage);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleWishlistClick = () => {
    router.push("/wishlist");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Back Button & Logo */}
          <div className="flex items-center gap-2">
            {pathname !== "/" && (
              <button
                onClick={() => router.back()}
                className="flex items-center px-2 py-1 text-gray-600 hover:text-indigo-600 rounded transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </button>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                AccessSellr
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleWishlistClick}
              className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <MiniCartPreview />
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.first_name || "Account"}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user?.first_name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                      {(user?.role === "admin" || user?.role === "super_admin") && (
                        <Link href="/admin/dashboard" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Admin Panel</span>
                        </Link>
                      )}
                      <Link href="/orders" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">Orders</span>
                      </Link>
                      <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <LogIn className="w-4 h-4" />
                        <span className="text-sm">Sign In</span>
                      </Link>
                      <Link href="/auth/register" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm">Register</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 