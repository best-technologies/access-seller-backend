'use client';

import { useState, useRef, useEffect } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight, TrendingUp, Award, BookOpen } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";

interface Book {
  id: number;
  title: string;
  author: string;
  desc: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  badge?: 'Bestseller' | 'Trending' | 'Hot' | "Editor's Choice";
  discount?: number;
  isNew?: boolean;
}

interface FeaturedBooksProps {
  books: any[];
  available_categories?: Array<{ id: string; name: string }>;
}

export default function FeaturedBooks({ books = [], available_categories = [] }: FeaturedBooksProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart, cart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Get random categories based on screen size
  const getRandomCategories = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxCategories = isMobile ? 4 : 8;
    
    if (available_categories.length <= maxCategories) {
      return available_categories;
    }
    
    // Shuffle and take random categories
    const shuffled = [...available_categories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxCategories);
  };

  const displayCategories = getRandomCategories();

  const filteredBooks = selectedCategory === "All" 
    ? books 
    : books.filter(book => book.category === selectedCategory);

  const isInCart = (bookId: string) => {
    return cart.some(item => item.productId === bookId);
  };

  const scroll = (direction: 'left' | 'right'): void => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.7;
      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const toggleFavorite = (book: Book): void => {
    const bookId = String(book.id);
    
    if (isInWishlist(bookId)) {
      removeFromWishlist(bookId);
      toast.success(`${book.title} removed from wishlist`);
    } else {
      addToWishlist({
        id: bookId,
        title: book.title,
        author: book.author,
        price: Number(book.price),
        image: book.image,
        category: book.category,
        rating: book.rating,
        reviews: book.reviews,
        originalPrice: book.originalPrice ? Number(book.originalPrice) : undefined,
        discount: book.discount,
        badge: book.badge,
        isNew: book.isNew
      });
      toast.success(`${book.title} added to wishlist`);
    }
  };

  const getBadgeIcon = (badge: Book['badge']): React.ReactElement | null => {
    switch (badge) {
      case 'Bestseller': return <Award className="w-3 h-3" />;
      case 'Trending': return <TrendingUp className="w-3 h-3" />;
      case 'Hot': return <span className="text-xs">🔥</span>;
      case "Editor's Choice": return <BookOpen className="w-3 h-3" />;
      default: return null;
    }
  };

  const getBadgeColor = (badge: Book['badge']): string => {
    switch (badge) {
      case 'Bestseller': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'Trending': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
      case 'Hot': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white';
      case "Editor's Choice": return 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="py-8 sm:py-12 px-2 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Enhanced Header */}
        <div className={`mb-8 sm:mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Curated Collection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Featured Books
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              Discover our handpicked selection of bestselling books across various genres
            </p>
          </div>

          {/* Enhanced Category Filter */}
          <div className="flex justify-center overflow-x-auto pb-2">
            <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white rounded-full shadow-lg border border-gray-200">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === "All"
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {displayCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category.name
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Books Container */}
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

          {/* Enhanced Books Grid */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-6 gap-3 sm:gap-4 px-2 sm:px-0 sm:snap-x sm:snap-mandatory scrollbar-hide scroll-smooth"
          >
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book, index) => (
                <div 
                  key={book.id} 
                  className={`group relative flex-none w-[140px] sm:w-[200px] transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`} 
                  style={{ transitionDelay: `${index * 100}ms`, minHeight: 340, maxHeight: 340, display: 'flex', flexDirection: 'column' }}
                >
                  {/* Enhanced Card */}
                  <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 hover:scale-105 snap-start flex flex-col h-full">
                    {/* Book Image Container */}
                    <div className="aspect-[3/4] w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <div className="relative w-full h-full">
                        <div 
                          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                          style={{ backgroundImage: `url(${book.image})` }}
                        />
                      </div>
                      
                      {/* Enhanced Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      
                      {/* Badges */}
                      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1">
                        {book.badge && (
                          <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg ${getBadgeColor(book.badge)}`}>
                            {getBadgeIcon(book.badge)}
                            <span className="text-[8px] sm:text-[10px]">{book.badge}</span>
                          </div>
                        )}
                        {book.discount && (
                          <div className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                            -{book.discount}%
                          </div>
                        )}
                        {book.isNew && (
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg">
                            New
                          </div>
                        )}
                      </div>

                      {/* Enhanced Favorite Button */}
                      <button 
                        onClick={() => toggleFavorite(book)}
                        className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                          isInWishlist(String(book.id))
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(String(book.id)) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Add to Cart Button */}
                      <button 
                        onClick={() => addToCart({
                          productId: String(book.id),
                          quantity: 1,
                          price: Number(book.price),
                          product: {
                            name: book.title,
                            image: book.image,
                            category: book.category
                          }
                        })}
                        className={`absolute top-1.5 sm:top-2 right-12 sm:right-14 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                          isInCart(String(book.id)) 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600'
                        }`}
                      >
                        <ShoppingCart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInCart(String(book.id)) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Quick Action Button - Visible on Hover */}
                      <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button className="w-full bg-white/95 backdrop-blur-sm text-gray-800 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-white transition-colors shadow-lg">
                          Quick View
                        </button>
                      </div>
                    </div>
                    
                    {/* Enhanced Content */}
                    <div className="p-2 sm:p-4 flex flex-col flex-1">
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                          {book.category}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-500">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                          <span className="text-[10px] sm:text-xs font-medium">{book.rating}</span>
                          <span className="text-[8px] sm:text-[10px] text-gray-400">({book.reviews})</span>
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <h3 className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">{book.author}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600 truncate mb-2 sm:mb-3 leading-relaxed">{book.desc}</p>
                      
                      {/* Enhanced Price & Action */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-lg font-bold text-indigo-600">₦{Number(book.price).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          {book.originalPrice && (
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through">₦{Number(book.originalPrice).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  No books found in {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 text-center max-w-md">
                  We couldn't find any books in this category. Try selecting a different category or check back later for new additions.
                </p>
                <button 
                  onClick={() => setSelectedCategory("All")}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                >
                  View All Books
                </button>
              </div>
            )}
          </div>

          {/* Enhanced Gradient Fade Effects */}
          <div className="hidden sm:block absolute right-0 top-0 bottom-8 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
          <div className="hidden sm:block absolute left-0 top-0 bottom-8 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mt-8 sm:mt-12">
          <button className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
            <span className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              View All Books
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}