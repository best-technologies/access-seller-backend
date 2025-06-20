'use client';

import { useState, useRef, useEffect } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight, TrendingUp, Award, BookOpen } from "lucide-react";
import { useCart } from "@/hooks/useCart";

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

const books: Book[] = [
  {
    id: 1,
    title: "Profit First",
    author: "Mike Michalowicz",
    desc: "Transform your business from a cash-eating monster to a money-making machine.",
    price: "24.99",
    originalPrice: "29.99",
    rating: 4.8,
    reviews: 2840,
    image: "/images/book-images/profit-first.png",
    category: "Business",
    badge: "Bestseller",
    discount: 17
  },
  {
    id: 2,
    title: "AI and MAchine Learning",
    author: "Jeff Walker",
    desc: "The ultimate guide to launching your product or service online.",
    price: "29.99",
    rating: 4.7,
    reviews: 1920,
    image: "/images/book-images/mockup-2.png",
    category: "Tech",
    badge: "Hot",
    isNew: true
  },
  {
    id: 3,
    title: "50 Shades of Growth",
    author: "Sid Bharath",
    desc: "A comprehensive guide to e-commerce growth strategies.",
    price: "19.99",
    originalPrice: "24.99",
    rating: 4.5,
    reviews: 856,
    image: "/images/book-images/Best-Ecommerce-Books-50-Shades-of-Growth-–-Sid-Bharath-and-D.png",
    category: "E-commerce",
    discount: 20
  },
  {
    id: 4,
    title: "E-commerce Essentials",
    author: "Various Authors",
    desc: "Master the fundamentals of online retail and digital commerce.",
    price: "22.99",
    rating: 4.6,
    reviews: 1240,
    image: "/images/book-images/ecommerce-book-cover.png",
    category: "E-commerce",
    badge: "Editor's Choice"
  },
  {
    id: 5,
    title: "Online Bookstore Guide",
    author: "Expert Authors",
    desc: "Step-by-step guide to setting up your online bookstore.",
    price: "17.99",
    rating: 4.4,
    reviews: 672,
    image: "/images/book-images/5-steps-to-set-up-your-online-bookstore-title.png",
    category: "Business"
  },
  {
    id: 6,
    title: "Digital Marketing Mastery",
    author: "Marketing Experts",
    desc: "Learn the art and science of digital marketing.",
    price: "26.99",
    rating: 4.7,
    reviews: 1560,
    image: "/images/book-images/TBm-300x300.png",
    category: "Marketing",
    badge: "Trending"
  },
  {
    id: 7,
    title: "Business Growth Strategies",
    author: "Business Leaders",
    desc: "Proven strategies for sustainable business growth.",
    price: "21.99",
    rating: 4.5,
    reviews: 920,
    image: "/images/book-images/mockup-2.png",
    category: "Business"
  },
  {
    id: 8,
    title: "E-commerce Success",
    author: "Industry Experts",
    desc: "The complete guide to building a successful online store.",
    price: "23.99",
    rating: 4.6,
    reviews: 1380,
    image: "/images/book-images/7733342_1580677080347book3d.png",
    category: "E-commerce"
  }
];

const categories = ["All", "Education", "Tech", "Business", "Marketing"] as const;
type Category = typeof categories[number];

export default function FeaturedBooks() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [isVisible, setIsVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const { addToCart } = useCart();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const filteredBooks = selectedCategory === "All" 
    ? books 
    : books.filter(book => book.category === selectedCategory);

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

  const toggleFavorite = (bookId: number): void => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bookId)) {
        newFavorites.delete(bookId);
      } else {
        newFavorites.add(bookId);
      }
      return newFavorites;
    });
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
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  {category}
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
            {filteredBooks.map((book, index) => (
              <div 
                key={book.id} 
                className={`group relative flex-none w-[140px] sm:w-[200px] transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Enhanced Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 hover:scale-105 snap-start">
                  
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
                      onClick={() => toggleFavorite(book.id)}
                      className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                        favorites.has(book.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${favorites.has(book.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Quick Action Button - Visible on Hover */}
                    <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <button className="w-full bg-white/95 backdrop-blur-sm text-gray-800 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-white transition-colors shadow-lg">
                        Quick View
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhanced Content */}
                  <div className="p-2 sm:p-4">
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
                    <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2 mb-2 sm:mb-3 leading-relaxed">{book.desc}</p>
                    
                    {/* Enhanced Price & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-sm sm:text-lg font-bold text-indigo-600">₦{Number(book.price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        {book.originalPrice && (
                          <span className="text-[10px] sm:text-xs text-gray-400 line-through">₦{Number(book.originalPrice).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        )}
                      </div>
                      <button
                        className="group/btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-0.5 sm:gap-1"
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
                      >
                        <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover/btn:scale-110 transition-transform" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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