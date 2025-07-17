import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNavTabs() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Helper to determine if a tab is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
      <Link href="/cart" className={`flex flex-col items-center justify-center ${isActive("/cart") ? "text-indigo-600" : "text-gray-600"}`}>
        <ShoppingCart className="w-6 h-6" />
        <span className="text-xs">Cart</span>
      </Link>
      {isLoading ? null : isAuthenticated && user ? (
        <Link href="/profile" className={`flex flex-col items-center justify-center ${isActive("/profile") ? "text-indigo-600" : "text-gray-600"}`}>
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </Link>
      ) : (
        <Link href="/auth/login" className={`flex flex-col items-center justify-center ${isActive("/auth/login") ? "text-indigo-600" : "text-gray-600"}`}>
          <User className="w-6 h-6" />
          <span className="text-xs">Sign In</span>
        </Link>
      )}
    </nav>
  );
} 