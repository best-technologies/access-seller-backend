"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Currency,
  Settings,
  MessageSquare,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard"
  },
  {
    title: "Products",
    icon: Package,
    href: "/admin/products"
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/admin/orders"
  },
  {
    title: "Customers",
    icon: Users,
    href: "/admin/customers"
  },
  {
    title: "Affiliates",
    icon: Currency,
    href: "/admin/referrals"
  },
  {
    title: "Discounts",
    icon: Currency,
    href: "/admin/promos-commissions"
  },
  // {
  //   title: "Analytics",
  //   icon: BarChart3,
  //   href: "/admin/analytics"
  // },
  {
    title: "Notifications",
    icon: MessageSquare,
    href: "/admin/messages"
  },
  {
    title: "Profile",
    icon: Settings,
    href: "/admin/profile"
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not logged in? Redirect to login
      if (!isAuthenticated) {
        router.replace("/");
      }
      // Not an admin? Redirect to home
      else if (user?.role !== "admin" && user?.role !== "super_admin") {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show a professional loading spinner while checking
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-gray-600 text-lg font-medium">Validating...</span>
        </div>
      </div>
    );
  }

  // Only render children if user is admin
  if (user.role === "admin" || user.role === "super_admin") {
    const handleNavigation = (href: string) => {
      router.push(href);
    };

    return (
      <div className="min-h-screen bg-gray-50">
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

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-gray-200">
              <button 
                onClick={() => handleNavigation("/")}
                className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Admin Panel
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-colors text-left ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button className="flex items-center gap-3 w-full px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`min-h-screen transition-all ${
            isSidebarOpen ? "lg:ml-64" : ""
          }`}
        >
          <div className="p-8">{children}</div>
        </main>
      </div>
    );
  }

  // Optionally, render a forbidden message (should not be seen due to redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-2">403 Forbidden</h1>
        <p className="text-gray-600">You do not have permission to access this page.</p>
      </div>
    </div>
  );
} 