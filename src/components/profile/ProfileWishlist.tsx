"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import type { WishlistItem } from "@/context/WishlistContext";

export default function ProfileWishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      productId: item.id,
      quantity: 1,
      price: item.price,
      sellingPrice: item.price,
      normalPrice: item.originalPrice ?? item.price,
      product: {
        name: item.title,
        image: item.image,
        category: item.category
      }
    });
  };

  const handleRemoveFromWishlist = (itemId: string, itemTitle: string) => {
    removeFromWishlist(itemId);
    toast.success(`${itemTitle} removed from wishlist`);
  };

  if (wishlist.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Wishlist is Empty</h3>
          <p className="text-gray-600 mb-6">
            Start building your collection by adding books you love to your wishlist
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Wishlist</h3>
          <span className="text-sm text-gray-500">{wishlist.length} items</span>
        </div>
        <div className="space-y-4">
          {wishlist.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="relative w-20 h-28 flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500">by {item.author}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">₦{item.price.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => handleRemoveFromWishlist(item.id, item.title)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 