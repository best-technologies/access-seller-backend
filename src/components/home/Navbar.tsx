'use client';

import { useState } from "react";
import MiniCartPreview from "@/components/home/MiniCartPreview";
import { 
  Menu, 
  X, 
  Home as HomeIcon, 
  BookOpen, 
  Tag, 
  User, 
  LogIn,
  ChevronDown,
  Package,
  Settings,
  LogOut,
  Search,
  Heart,
  UserPlus,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loadingPrintingPress, setLoadingPrintingPress] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const router = useRouter();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const successMessage = await logout();
      setIsUserMenuOpen(false);
      toast.success(successMessage);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleWishlistClick = () => {
    router.push("/wishlist");
  };

  const handlePrintingPressClick = async () => {
    setLoadingPrintingPress(true);
    // Simulate API call (e.g., permission check or prefetch)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoadingPrintingPress(false);
    router.push("/printing-inventory");
  };

  return (
    <>
      {/* Loader for Printing Press */}
      {loadingPrintingPress && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30">
          <Loader title="Loading Printing Press..." message="Preparing the Printing Press dashboard..." />
        </div>
      )}
      {/* Modern Navbar with Glass Effect */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  AccessSellr
                </span>
              </Link>
            </div>

            {/* Mobile Search and Actions */}
            <div className="flex items-center space-x-3 md:hidden">
              <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={handleWishlistClick}
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <MiniCartPreview />
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* Printing Press Button (Mobile) */}
              {isAuthenticated && (user?.role === "admin" || user?.role === "inventory_manager") && (
                <button
                  onClick={handlePrintingPressClick}
                  className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-100 transition-colors"
                  aria-label="Go to Printing Press"
                  disabled={loadingPrintingPress}
                >
                  <Printer className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Search Bar */}
              <div className="relative w-64 lg:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search books, authors..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  Browse
                </Link>
                <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  Categories
                </Link>
                {/* Printing Press Button (Desktop) */}
                {isAuthenticated && (user?.role === "admin" || user?.role === "inventory_manager") && (
                  <button
                    onClick={handlePrintingPressClick}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-label="Go to Printing Press"
                    disabled={loadingPrintingPress}
                  >
                    <Printer className="w-5 h-5" />
                    <span>Printing Press</span>
                  </button>
                )}
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleWishlistClick}
                  className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
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
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{user?.first_name || 'Account'}</span>
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
                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
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
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[99] md:hidden"
          onClick={handleBackdropClick}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Menu</span>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Bar Mobile */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search books, authors..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-4 space-y-1">
                  <Link href="/" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <HomeIcon className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Home</span>
                  </Link>
                  <Link href="/products" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Browse</span>
                  </Link>
                  <Link href="/categories" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Categories</span>
                  </Link>
                  <Link href="/wishlist" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Heart className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="ml-auto bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  {/* User-specific menu items - only show when authenticated */}
                  {isAuthenticated && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <Link href="/profile" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <User className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>
                      {/* Printing Press Button (Mobile Menu) */}
                      {(user?.role === "admin" || user?.role === "inventory_manager") && (
                        <button
                          onClick={handlePrintingPressClick}
                          className="flex items-center space-x-3 px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors w-full"
                          aria-label="Go to Printing Press"
                          disabled={loadingPrintingPress}
                        >
                          <Printer className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium">Printing Press</span>
                        </button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <Link href="/admin/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium">Admin Panel</span>
                        </Link>
                      )}
                      <Link href="/orders" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Package className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium">Orders</span>
                      </Link>
                      <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium">Settings</span>
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Link href="/auth/login">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 flex items-center justify-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign In</span>
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="outline" className="w-full rounded-lg py-2 flex items-center justify-center space-x-2">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">Register</span>
                      </Button>
                    </Link>
                  </>
                ) : (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 