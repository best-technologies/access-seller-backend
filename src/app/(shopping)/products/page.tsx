"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Filter, 
  Search,
  Heart, 
  ShoppingCart,
  Book,
  BookOpen,
  Grid3X3,
  List,
  Eye,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  ArrowRight,
  ThumbsUp
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";
import { api } from '@/services/api';
import Loader from "@/components/Loader";
import type { BrowseProduct, BrowseCategory } from '@/types/product';
import { PageLoader } from "@/components/ui/loader";
import Navbar from "@/components/home/Navbar";

export default function ProfessionalProductsPage() {
  const CACHE_KEY = 'browse_products_cache_v1';
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [products, setProducts] = useState<BrowseProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<BrowseCategory[]>([]);
  const { cart, addToCart, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();


  // Enhanced fetch with error handling
  const fetchProducts = async (pageToFetch = 1, useCache = true) => {
    if (pageToFetch === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      // Try cache only on first page
      if (pageToFetch === 1 && useCache) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
            setCategories(parsed.categories || []);
            setHasMore(parsed.hasMore);
            setProducts(parsed.products || []);
            setIsLoading(false);
            setIsLoadingMore(false);
            return;
          }
        }
      }
      const response = await api.public.getBrowseProducts(pageToFetch);
      if (response.success) {
        setCategories(response.data.categories || []);
        setHasMore(response.data.hasMore);
        if (pageToFetch === 1) {
          setProducts(response.data.products);
          console.log("Browse products from db: ", response.data.products)
          // Cache only first page
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            products: response.data.products,
            categories: response.data.categories,
            hasMore: response.data.hasMore,
            timestamp: Date.now(),
          }));
        } else {
          setProducts(prev => [...prev, ...response.data.products]);
        }
      }
    } catch (error) {
      console.error('[Browse Products API Error]', error);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, []);

  function loadMoreProducts() {
    if (!hasMore || isLoadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  }

  const handleForceRefresh = () => {
    setPage(1);
    // Clear cache and refetch
    localStorage.removeItem(CACHE_KEY);
    fetchProducts(1, false);
    toast.success('Products refreshed successfully');
  };

  const toggleWishlist = (product: BrowseProduct) => {
    const productId = String(product.id);
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success(`${product.product_name} removed from wishlist`);
    } else {
      addToWishlist({
        id: String(product.id),
        title: product.product_name,
        author: product.author,
        price: product.selling_price,
        image: typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png',
        category: product.format,
        isNew: product.is_new
      });
      toast.success(`${product.product_name} added to wishlist`);
    }
  };

  const handleAddToCart = (product: BrowseProduct) => {
    const productId = String(product.id);
    
    if (isInCart(productId)) {
      removeFromCart(productId);
      // toast.success(`${product.product_name} removed from cart`);
    } else {
      
      addToCart({
        productId: productId,
        quantity: 1,
        price: Number(product.selling_price),
        sellingPrice: Number(product.selling_price),
        normalPrice: Number(product.nomral_price),
        product: {
          name: product.product_name,
          image: typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png',
          category: String(product.format ?? '')
        }
      });
      // toast.success(`${product.product_name} added to cart`);
    }
  };

  const isInCart = (productId: string) => cart.some(item => item.productId === productId);

  const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    BookOpen, Book, Zap, Heart, Eye, Users, Calendar, TrendingUp,
  };

  const filteredProducts = products.filter((product: BrowseProduct) => {
    if (selectedCategory !== "all") {
      if (!product.categories?.some((cat: { id: string }) => cat.id === selectedCategory)) {
        return false;
      }
    }
    if (searchQuery && !product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) && !product.author.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const productsByCategory: Record<string, BrowseProduct[]> = {};
  filteredProducts.forEach((product) => {
    if (product.categories && product.categories.length > 0) {
      product.categories.forEach((cat: { id: string; name: string }) => {
        if (!productsByCategory[cat.name]) productsByCategory[cat.name] = [];
        productsByCategory[cat.name].push(product);
      });
    } else {
      if (!productsByCategory['Uncategorized']) productsByCategory['Uncategorized'] = [];
      productsByCategory['Uncategorized'].push(product);
    }
  });

  if (isLoading) return <Loader />;

  // const getBadgeIcon = (badge: string) => {
  //   switch (badge) {
  //     case 'Bestseller': return <Award className="w-3 h-3" />;
  //     case 'Trending': return <TrendingUp className="w-3 h-3" />;
  //     case 'Hot': return <Sparkles className="w-3 h-3" />;
  //     case "Editor's Choice": return <BookOpen className="w-3 h-3" />;
  //     case 'New': return <Clock className="w-3 h-3" />;
  //     default: return <Shield className="w-3 h-3" />;
  //   }
  // };

  // const getBadgeColor = (badge: string) => {
  //   switch (badge) {
  //     case 'Bestseller': return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg';
  //     case 'Trending': return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg';
  //     case 'Hot': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg';
  //     case "Editor's Choice": return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg';
  //     case 'New': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg';
  //     default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
  //   }
  // };

  const ScrollableProductRow = ({ categoryName, products: categoryProducts }: { categoryName: string; products: BrowseProduct[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
  
    const updateScrollButtons = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
  
    useEffect(() => {
      const timer = setTimeout(() => {
        updateScrollButtons();
      }, 100);
  
      const element = scrollRef.current;
      if (element) {
        element.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);
        return () => {
          element.removeEventListener('scroll', updateScrollButtons);
          window.removeEventListener('resize', updateScrollButtons);
          clearTimeout(timer);
        };
      }
    }, [categoryProducts]);
  
    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const scrollAmount = 300;
        const targetScroll = direction === 'left'
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    };
  
    return (
      <div className="mb-12">
        {/* Enhanced Category Header with Divider */}
        <div className="relative flex items-center justify-between mb-8">
          {/* Divider background */}
          <div className="absolute inset-0 h-14 bg-gradient-to-r from-indigo-50 via-white to-purple-50 rounded-2xl -z-10 shadow-sm" />
          <div className="flex items-center gap-4 pl-6">
            <span className="inline-block w-2 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 mr-4" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight capitalize drop-shadow-sm">
              {categoryName}
            </h2>
            <span className="ml-3 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-base font-semibold shadow-sm">
              {categoryProducts.length} {categoryProducts.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          <Link 
            href={`/categories/${categoryName.toLowerCase()}`}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-base transition-colors group pr-6"
          >
            View all
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
  
        {/* Scrollable Container - Fixed positioning */}
        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 hover:scale-105"
              style={{ marginLeft: '-20px' }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
  
          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 hover:scale-105"
              style={{ marginRight: '-20px' }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
  
          {/* Products scroll container */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide"
            style={{ 
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categoryProducts.map((product) => {
              const slug = `${product.id}-${product.product_name.toLowerCase().replace(/\s+/g, '-')}`;
              const discount = (product.nomral_price > product.selling_price) 
                ? Math.round(100 * (1 - (product.selling_price / product.nomral_price))) 
                : undefined;
              // const badge = product.total_sold > 100 ? 'Bestseller' : product.is_new ? 'New' : "";

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[240px]"
                  style={{ scrollSnapAlign: 'start', height: '340px' }}
                >
                  <Link 
                    href={`/products/${slug}`} 
                    className="group relative block transition-all duration-300 hover:scale-105"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 h-full flex flex-col">
                      {/* Image Container */}
                      <div className="w-full h-[170px] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        <div className="relative w-full h-full">
                          <div 
                            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                            style={{ 
                              backgroundImage: `url(${typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                        {/* Badges */}
                        {discount && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            -{discount}% OFF
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex flex-row gap-2">
                          <button 
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className={`p-2.5 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                              isInWishlist(String(product.id))
                                ? 'bg-red-500 text-white'
                                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500'
                            }`}
                            title="Add to wishlist"
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(String(product.id)) ? 'fill-current' : ''}`} />
                          </button>

                          <button 
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className={`p-2.5 rounded-full transition-all duration-300 shadow-lg hover:scale-110 ${
                              isInCart(String(product.id)) 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600'
                            }`}
                            title="Add to cart"
                          >
                            <ShoppingCart className={`w-4 h-4 ${isInCart(String(product.id)) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Quick View Button */}
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button className="w-full bg-white/95 backdrop-blur-sm text-gray-800 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-white transition-colors shadow-lg flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            Quick View
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                            {product.format}
                          </span>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium text-gray-700">4.5</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {product.product_name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 font-medium">by {product.author}</p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-indigo-600">
                              ₦{(product.selling_price).toLocaleString()}
                            </span>
                            {product.nomral_price > product.selling_price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₦{(product.nomral_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{product.total_sold || 0} sold</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Discover Books</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'book' : 'books'} available
                </p>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books, authors, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleForceRefresh}
                className="p-3 rounded-xl hover:bg-gray-100 transition-colors group"
                title="Refresh products"
              >
                <RefreshCw className="h-5 w-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
              </button>

              <div className="flex items-center border border-gray-300 rounded-xl p-1 bg-white">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors font-medium"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest First</option>
                <option value="bestseller">Bestsellers</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar */}
          <div className={`w-56 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-4 pr-1">
              {/* Categories */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Categories
                </h2>
                <div className={`space-y-1 ${categories.length > 10 ? 'max-h-96 overflow-y-auto' : ''}`}>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium ${
                      selectedCategory === "all"
                        ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
                        : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <Book className="h-4 w-4" />
                    <span className="flex-1 text-left">All Categories</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {products.length}
                    </span>
                  </button>
                  {categories.map((category) => {
                    const IconComponent = category.icon ? iconMap[category.icon] : BookOpen;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium ${
                          selectedCategory === category.id
                            ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1 text-left">{category.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {category.total_books}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range - Coming Soon */}
              {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 opacity-60">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Price Range</h3>
                <div className="text-center text-gray-500 py-8">
                  <Shield className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Coming Soon</p>
                </div>
              </div> */}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {Object.entries(productsByCategory)
              .filter(([cat]) => selectedCategory === 'all' || categories.find(c => c.name === cat)?.id === selectedCategory)
              .map(([categoryName, categoryProducts]) => {
                if (categoryProducts.length === 0) return null;
                return (
                  <ScrollableProductRow
                    key={categoryName}
                    categoryName={categoryName}
                    products={categoryProducts}
                  />
                );
              })}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {isLoadingMore ? (
                    <>
                      <PageLoader />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Load More Books
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}