import { useWishlistContext } from "../context/WishlistContext";

// Wishlist logic hook
export function useWishlist() {
  return useWishlistContext();
} 