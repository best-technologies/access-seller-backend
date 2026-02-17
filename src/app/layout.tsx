'use client';

import Footer from "@/components/home/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import MobileNavTabs from "@/components/common/MobileNavTabs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white" style={{ '--mobile-nav-height': '64px' } as React.CSSProperties}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* Navbar at the top */}
              {/* <Navbar /> */}
              {/* Main Content */}
              <main>
                {children}
              </main>

              {/* Mobile Bottom Nav Tabs */}
              <MobileNavTabs />

              {/* Footer */}
              <Footer />
              
              {/* Toaster for notifications */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 2000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    marginBottom: 'var(--mobile-nav-height)',
                    fontSize: '14px', // Smaller font for mobile
                  },
                  success: {
                    duration: 2000,
                    style: {
                      background: '#10b981',
                      color: '#fff',
                      marginBottom: 'var(--mobile-nav-height)',
                      fontSize: '14px', // Smaller font for mobile
                    },
                  },
                  error: {
                    duration: 2000,
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                      marginBottom: 'var(--mobile-nav-height)',
                      fontSize: '14px', // Smaller font for mobile
                    },
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
