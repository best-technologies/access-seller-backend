'use client';

import { CardContent } from "@/components/ui/card";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Loader } from "@/components/ui/loader";

interface Book {
  id: string;
  title: string;
  author: string;
  desc: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  reviews?: number;
  image: string;
  releaseDate?: string;
  sellingPrice?: string;
  normalPrice?: string;
  category?: string; // Added for wishlist
}

interface NewArrivalsProps {
  books: Book[];
  loading?: boolean;
  error?: string | null;
}

export default function NewArrivals({ books = [], loading = false, error = null }: NewArrivalsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart, removeFromCart, cart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isInCart = (bookId: string) => cart.some(item => item.productId === bookId);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="py-8 sm:py-16 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">New Arrivals</h2>
            <p className="text-sm sm:text-base text-gray-600">Discover the latest releases from your favorite authors</p>
          </div>
          {/* <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base">
            View All
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
          </Button> */}
        </div>

        <div className="relative">
          {/* Navigation Buttons - Hidden on Mobile */}
          <button 
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Grid Layout for Mobile, Scrollable for Desktop */}
          <div className="flex overflow-x-auto pb-6 gap-3 px-4 sm:px-0 sm:gap-4 sm:snap-x sm:snap-mandatory sm:scrollbar-hide">
            {loading ? (
              <div className="flex justify-center items-center w-full min-h-[200px]"><Loader size="lg" variant="primary" /></div>
            ) : error ? (
              <div className="flex justify-center items-center w-full min-h-[200px] text-red-500">{error}</div>
            ) : books.length === 0 ? (
              <div className="flex justify-center items-center w-full min-h-[200px] text-gray-500">No new arrivals at the moment.</div>
            ) : (
              books.map((b) => {
                const slug = `${b.id}-${b.title.toLowerCase().replace(/\s+/g, '-')}`;
                return (
                  <Link key={b.id} href={`/products/${slug}`} className="group relative flex-none w-[140px] sm:w-[180px] overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 snap-start">
                    <div className="aspect-[3/4] w-full bg-gray-100 relative overflow-hidden">
                      <div className="relative w-full h-full">
                        <Image 
                          src={b.image} 
                          alt={b.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-white/90 rounded-full text-[8px] sm:text-[10px] font-medium text-indigo-600">
                        <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        {b.releaseDate}
                      </div>
                      {/* Wishlist Icon */}
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInWishlist(String(b.id))) {
                            removeFromWishlist(String(b.id));
                          } else {
                            addToWishlist({
                              id: String(b.id),
                              title: b.title,
                              author: b.author,
                              price: Number(b.price),
                              image: b.image,
                              category: b.category ?? '',
                              rating: b.rating,
                              reviews: b.reviews,
                              originalPrice: b.originalPrice ? Number(b.originalPrice) : undefined,
                              discount: undefined,
                              badge: undefined,
                              isNew: undefined
                            });
                          }
                        }}
                        className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                          isInWishlist(String(b.id))
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(String(b.id)) ? 'fill-current' : ''}`} />
                      </button>
                      {/* Cart Icon */}
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInCart(String(b.id))) {
                            removeFromCart(String(b.id));
                          } else {
                            addToCart({
                              productId: String(b.id),
                              quantity: 1,
                              price: Number(b.price),
                              sellingPrice: Number(b.sellingPrice ?? b.price),
                              normalPrice: Number(b.normalPrice ?? b.originalPrice ?? b.price),
                              product: {
                                name: b.title,
                                image: b.image,
                                category: b.category ?? ''
                              }
                            });
                          }
                        }}
                        className={`absolute top-1.5 sm:top-2 right-10 sm:right-12 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                          isInCart(String(b.id))
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600'
                        }`}
                      >
                        <ShoppingCart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInCart(String(b.id)) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <CardContent className="p-1.5 sm:p-2">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h3 className="font-semibold text-[10px] sm:text-xs mb-0.5 line-clamp-1">{b.title}</h3>
                          <p className="text-[8px] sm:text-[10px] text-gray-500 mb-0.5">{b.author}</p>
                          <p className="text-[8px] sm:text-[10px] text-gray-600 line-clamp-2 mb-1">{b.desc}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-indigo-600">₦{Number(b.price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                );
              })
            )}
          </div>

          {/* Gradient Fade Effect - Hidden on Mobile */}
          <div className="hidden sm:block absolute right-0 top-0 bottom-8 w-24 bg-gradient-to-l from-white pointer-events-none" />
          <div className="hidden sm:block absolute left-0 top-0 bottom-8 w-24 bg-gradient-to-r from-white pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
