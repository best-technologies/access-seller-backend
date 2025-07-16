'use client';

// import { CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw, Star } from "lucide-react";
import { useRef } from "react";
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
  onRetry?: () => void;
}

export default function NewArrivals({ books = [], loading = false, error = null, onRetry }: NewArrivalsProps) {
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
          {/* Enhanced Navigation Buttons */}
          <button 
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl border border-gray-200 items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl border border-gray-200 items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Enhanced Books Row */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-6 gap-3 sm:gap-4 px-2 sm:px-0 sm:snap-x sm:snap-mandatory scrollbar-hide scroll-smooth"
          >
            {loading ? (
              <div className="flex justify-center items-center w-full min-h-[200px]"><Loader size="lg" variant="primary" /></div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center w-full min-h-[200px] text-red-500 gap-2">
                <span>{error}</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition-colors text-xs font-medium mt-2"
                  >
                    <RotateCcw className="w-4 h-4 mr-1 animate-spin-slow" /> Try Again
                  </button>
                )}
              </div>
            ) : books.length === 0 ? (
              <div className="flex justify-center items-center w-full min-h-[200px] text-gray-500">No new arrivals at the moment.</div>
            ) : (
              books.map((b, index) => {
                const slug = `${b.id}-${b.title.toLowerCase().replace(/\s+/g, '-')}`;
                return (
                  <Link key={b.id} href={`/products/${slug}`} className="group relative flex-none w-[140px] sm:w-[200px] transition-all duration-700" style={{ transitionDelay: `${index * 100}ms`, minHeight: 340, maxHeight: 340, display: 'flex', flexDirection: 'column' }}>
                    {/* Enhanced Card */}
                    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 hover:scale-105 snap-start flex flex-col h-full">
                      {/* Book Image Container */}
                      <div className="aspect-[3/4] w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        <div className="relative w-full h-full">
                          <div 
                            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                            style={{ backgroundImage: `url(${b.image})` }}
                          />
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        {/* Badges */}
                        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1">
                          {b.releaseDate && (
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg">
                              New {b.releaseDate}
                            </div>
                          )}
                        </div>
                        {/* Wishlist Button */}
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
                        {/* Cart Button */}
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
                          className={`absolute top-1.5 sm:top-2 right-12 sm:right-14 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                            isInCart(String(b.id)) 
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                              : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600'
                          }`}
                        >
                          <ShoppingCart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInCart(String(b.id)) ? 'fill-current' : ''}`} />
                        </button>
                        {/* Quick Action Button - Visible on Hover */}
                        <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button className="w-full bg-white/95 backdrop-blur-sm text-gray-800 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-white transition-colors shadow-lg">
                            Quick View
                          </button>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-2 sm:p-4 flex flex-col flex-1">
                        {/* Category & Rating */}
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                            {b.category}
                          </span>
                          {b.rating !== undefined && (
                            <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-500">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                              <span className="text-[10px] sm:text-xs font-medium">{b.rating}</span>
                              <span className="text-[8px] sm:text-[10px] text-gray-400">({b.reviews})</span>
                            </div>
                          )}
                        </div>
                        {/* Book Info */}
                        <h3 className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {b.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">{b.author}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate mb-2 sm:mb-3 leading-relaxed">{b.desc}</p>
                        {/* Price & Action */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-sm sm:text-lg font-bold text-indigo-600">₦{Number(b.price).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                            {b.originalPrice && (
                              <span className="text-[10px] sm:text-xs text-gray-400 line-through">₦{Number(b.originalPrice).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Enhanced Gradient Fade Effects */}
          <div className="hidden sm:block absolute right-0 top-0 bottom-8 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
          <div className="hidden sm:block absolute left-0 top-0 bottom-8 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}
