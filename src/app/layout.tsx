'use client';

import Footer from "@/components/home/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* Main Content */}
              <main>
                {children}
              </main>

              {/* Footer */}
              <Footer />
              
              {/* Toaster for notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 4000,
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    style: {
                      background: '#ef4444',
                      color: '#fff',
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
