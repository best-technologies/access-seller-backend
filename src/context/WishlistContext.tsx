import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface WishlistItem {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  originalPrice?: number;
  discount?: number;
  badge?: string;
  isNew?: boolean;
  addedAt: number; // Timestamp when item was added
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (itemId: string) => void;
  isInWishlist: (itemId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wishlist");
    if (stored) {
      try {
        const parsedWishlist = JSON.parse(stored);
        // Migrate existing wishlist items that don't have addedAt field
        const migratedWishlist = parsedWishlist.map((item: any, index: number) => {
          if (!item.addedAt) {
            // For existing items without addedAt, use a timestamp that puts older items first
            // This ensures existing items appear in the order they were originally added
            return { ...item, addedAt: Date.now() - (parsedWishlist.length - index) * 1000 };
          }
          return item;
        });
        setWishlist(migratedWishlist);
      } catch (error) {
        console.error("Error parsing wishlist from localStorage:", error);
        setWishlist([]);
      }
    }
  }, []);

  // Save wishlist to localStorage on change
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
    setWishlist(prev => {
      const existing = prev.find(wi => wi.id === item.id);
      if (existing) {
        return prev; // Item already exists
      }
      // Add new item at the beginning of the array (most recent first)
      return [{ ...item, addedAt: Date.now() }, ...prev];
    });
  };

  const removeFromWishlist = (itemId: string) => {
    setWishlist(prev => prev.filter(wi => wi.id !== itemId));
  };

  const isInWishlist = (itemId: string) => {
    return wishlist.some(item => item.id === itemId);
  };

  const clearWishlist = () => setWishlist([]);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist, 
      clearWishlist,
      wishlistCount 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlistContext must be used within a WishlistProvider");
  return ctx;
}; 