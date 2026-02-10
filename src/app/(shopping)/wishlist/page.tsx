"use client";

import { useState } from "react";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft,
  BookOpen,
  Star,
  TrendingUp,
  Award,
  Eye,
  Share2,
  SortAsc,
  Grid3X3,
  List
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import Navbar from "@/components/home/Navbar";
import type { WishlistItem } from "@/context/WishlistContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "price" | "name">("date");

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

  const handleClearWishlist = () => {
    clearWishlist();
    toast.success("Wishlist cleared");
  };

  const sortedWishlist = [...wishlist].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price - b.price;
      case "name":
        return a.title.localeCompare(b.title);
      case "date":
        // Sort by addedAt timestamp (newest first)
        return b.addedAt - a.addedAt;
      default:
        // Default: newest first (by addedAt timestamp)
        return b.addedAt - a.addedAt;
    }
  });

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Bestseller': return <Award className="w-3 h-3" />;
      case 'Trending': return <TrendingUp className="w-3 h-3" />;
      case 'Hot': return <span className="text-xs">🔥</span>;
      case "Editor's Choice": return <BookOpen className="w-3 h-3" />;
      default: return null;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Bestseller': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'Trending': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
      case 'Hot': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white';
      case "Editor's Choice": return 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (wishlist.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Start building your collection by adding books you love to your wishlist
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse Books
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="px-8 py-3 rounded-lg font-medium">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button variant="outline" className="rounded-full p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600 mt-1">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid" 
                        ? "bg-indigo-100 text-indigo-600" 
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list" 
                        ? "bg-indigo-100 text-indigo-600" 
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "price" | "name")}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date">Newest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleClearWishlist}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Link href="/products">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse More
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Summary - Moved to top */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Wishlist Summary</h3>
                <p className="text-gray-600">
                  Total value: ₦{wishlist.reduce((total, item) => total + item.price, 0).toLocaleString(undefined, {maximumFractionDigits:0})}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    wishlist.forEach(item => handleAddToCart(item));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Wishlist Items */}
          <div className={viewMode === "grid" ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3" : "space-y-4"}>
            {sortedWishlist.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                {/* Image */}
                <div className={`relative ${viewMode === "list" ? "w-32 flex-shrink-0" : "aspect-[3/4]"}`}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-0.5 left-0.5 flex flex-col gap-0.5">
                    {item.badge && (
                      <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8px] font-medium shadow-lg ${getBadgeColor(item.badge)}`}>
                        {getBadgeIcon(item.badge)}
                        <span className="text-[6px]">{item.badge}</span>
                      </div>
                    )}
                    {item.discount && (
                      <div className="bg-red-500 text-white px-1 py-0.5 rounded-full text-[8px] font-bold shadow-lg">
                        -{item.discount}%
                      </div>
                    )}
                    {item.isNew && (
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-1 py-0.5 rounded-full text-[8px] font-medium shadow-lg">
                        New
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-0.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600 transition-colors">
                      <Eye className="w-2.5 h-2.5" />
                    </button>
                    <button className="p-0.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-800 transition-colors">
                      <Share2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-2 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-medium px-1 py-0.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                      {item.category}
                    </span>
                    {item.rating && (
                      <div className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="w-2 h-2 fill-current" />
                        <span className="text-[8px] font-medium">{item.rating}</span>
                        {item.reviews && (
                          <span className="text-[6px] text-gray-400">({item.reviews})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-0.5 line-clamp-2 text-[10px] group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[8px] text-gray-500 mb-1">{item.author}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        ₦{item.price.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[8px] text-gray-400 line-through">
                          ₦{item.originalPrice.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] py-1"
                    >
                      <ShoppingCart className="w-2.5 h-2.5 mr-0.5" />
                      Add
                    </Button>
                    <Button
                      onClick={() => handleRemoveFromWishlist(item.id, item.title)}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 p-1"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 