import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import toast from "react-hot-toast";

export interface WishlistItem {
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
  const lastToastRef = useRef<string>('');
  const [hasMounted, setHasMounted] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (lastToastRef.current === message) return;
    lastToastRef.current = message;
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
    setTimeout(() => {
      lastToastRef.current = '';
    }, 100);
  };

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wishlist");
    if (stored) {
      try {
        const parsedWishlist = JSON.parse(stored);
        // Migrate existing wishlist items that don't have addedAt field
        const migratedWishlist = parsedWishlist.map((item: WishlistItem, index: number) => {
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
    setHasMounted(true);
  }, []);

  // Save wishlist to localStorage on change
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  if (!hasMounted) return null;

  const addToWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
    setWishlist(prev => {
      const existing = prev.find(wi => wi.id === item.id);
      if (existing) {
        return prev; // Item already exists
      }
      showToast(`${item.title} added to wishlist!`);
      // Add new item at the beginning of the array (most recent first)
      return [{ ...item, addedAt: Date.now() }, ...prev];
    });
  };

  const removeFromWishlist = (itemId: string) => {
    setWishlist(prev => {
      const itemToRemove = prev.find(wi => wi.id === itemId);
      if (itemToRemove) {
        showToast(`${itemToRemove.title} removed from wishlist!`, 'error');
      }
      return prev.filter(wi => wi.id !== itemId);
    });
  };

  const isInWishlist = (itemId: string) => {
    return wishlist.some(item => item.id === itemId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    showToast("Wishlist cleared!", 'error');
  };

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