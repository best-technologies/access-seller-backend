"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Check,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";
import { api } from '@/services/api';
import Loader from "@/components/Loader";
import type { BrowseProduct, BrowseCategory, BrowseFormat } from '@/types/product';
import { PageLoader } from "@/components/ui/loader";

export default function ProfessionalProductsPage() {
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
  // const [formats, setFormats] = useState<BrowseFormat[]>([]);
  const [categories, setCategories] = useState<BrowseCategory[]>([]);
  // const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const { cart, addToCart, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Fetch products for a given page
  const fetchProducts = async (pageToFetch = 1) => {
    if (pageToFetch === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const response = await api.public.getBrowseProducts(pageToFetch);
      if (response.success) {
        // setFormats(response.data.formats || []);
        setCategories(response.data.categories || []);
        setHasMore(response.data.hasMore);
        if (pageToFetch === 1) {
          setProducts(response.data.products);
        } else {
          setProducts(prev => [...prev, ...response.data.products]);
        }
      }
    } catch (error) {
      console.error('[Browse Products API Error]', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, []);

  function loadMoreProducts() {
    if (!hasMore) return;
    setIsLoadingMore(true);
    fetchProducts(page + 1);
  }

  const handleForceRefresh = () => {
    // localStorage.removeItem(CACHE_KEY);
    fetchProducts(1);
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

  const isInCart = (productId: string) => cart.some(item => item.productId === productId);

  // Icon mapping for backend icon strings
  const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    BookOpen,
    Book,
    Zap,
    Heart,
    Eye,
    Users,
    Calendar,
    TrendingUp,
  };

  const filteredProducts = products.filter((product: BrowseProduct) => {
    if (selectedCategory !== "all") {
      if (!product.categories?.some((cat: { id: string }) => cat.id === selectedCategory)) {
        return false;
      }
    }
    // Fix: Filter by selectedFormats
    // if (selectedFormats.length > 0) {
    //   if (!selectedFormats.includes(product.format)) {
    //     return false;
    //   }
    // }
    if (
      searchQuery &&
      !product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.author.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) return <Loader />;

  return (
    <>
      
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Discover Books</h1>
                  <p className="text-xs text-gray-500">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'book' : 'books'} available
                  </p>
                </div>
              </div>
              {/* Force Refresh Icon */}
              <button
                onClick={handleForceRefresh}
                title="Force Refresh"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-gray-500" />
              </button>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search books, authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg p-0.5 bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded ${viewMode === "grid" ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded ${viewMode === "list" ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Compact Sidebar */}
            <div className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-24 space-y-4">
                {/* Categories */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    Categories
                  </h2>
                  <div className="space-y-1">
                    {categories.map((category) => {
                      const IconComponent = category.icon ? iconMap[category.icon] : BookOpen;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all ${
                            selectedCategory === category.id
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                              : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                          <span className="flex-1 text-left">{category.name}</span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                            {category.total_books}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Format Filter */}
                {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Format</h3>
                  <div className="space-y-2">
                    {formats.map((format) => (
                      <label key={format.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={selectedFormats.includes(format.name)}
                          onChange={() => {
                            setSelectedFormats(prev =>
                              prev.includes(format.name)
                                ? prev.filter(f => f !== format.name)
                                : [...prev, format.name]
                            );
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                        />
                        <span className="text-xs text-gray-700 group-hover:text-gray-900">{format.name}</span>
                      </label>
                    ))}
                  </div>
                </div> */}

                {/* Price Range */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-50 pointer-events-none select-none">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Price Range (coming soon)</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {/* Price range radio buttons removed */}
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                          disabled
                        />
                        <span className="text-gray-500 text-xs">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
              </div>
            </div>

            {/* Product Grid/List */}
            <div className="flex-1">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product: BrowseProduct) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                      style={{ minWidth: 0 }}
                    >
                      <Link href={`/products/${product.id}-${product.product_name.toLowerCase().replace(/\s+/g, '-')}`}>
                        <div className="relative overflow-hidden">
                          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                            <Image
                              src={typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png'}
                              alt={product.product_name}
                              width={220}
                              height={293}
                              className="h-full w-full object-cover object-center"
                            />
                            {product.is_new && (
                              <span className="absolute top-1.5 left-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-medium text-white">
                                New
                              </span>
                            )}
                            {/* Wishlist and Cart Icons */}
                            <div className="absolute top-2 right-2 z-10">
                              <button
                                onClick={e => {
                                  e.preventDefault();
                                  toggleWishlist(product);
                                }}
                                className={`p-2 rounded-full transition-colors shadow-sm ${
                                  isInWishlist(String(product.id))
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                                }`}
                                title={isInWishlist(String(product.id)) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                              >
                                <Heart className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                              product.stock_status === 'In Stock'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.stock_status}
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          <div className="mb-1 flex items-center justify-between">
                            {typeof product.stock_count === 'number' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                                {product.stock_count}
                              </span>
                            )}
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1 py-0.5 rounded">
                              {product.format}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                            {product.product_name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">by {product.author}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-bold text-gray-900">₦{product.selling_price}</span>
                            {product.nomral_price ? (
                              <div className="text-sm text-gray-500 line-through">₦{product.nomral_price}</div>
                            ) : null}
                            <button
                              onClick={e => {
                                e.preventDefault();
                                if (isInCart(String(product.id))) {
                                  removeFromCart(String(product.id));
                                } else {
                                  addToCart({
                                    productId: String(product.id),
                                    quantity: 1,
                                    price: product.selling_price,
                                    sellingPrice: product.selling_price,
                                    normalPrice: product.nomral_price ?? product.selling_price,
                                    product: {
                                      name: product.product_name,
                                      image: typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png',
                                      category: product.format
                                    }
                                  });
                                }
                              }}
                              className={`p-2 rounded-full transition-colors shadow-sm ml-1 ${
                                isInCart(String(product.id))
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-green-600'
                              }`}
                              title={isInCart(String(product.id)) ? 'Remove from Cart' : 'Add to Cart'}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                /* Compact List View */
                <div className="space-y-3">
                  {filteredProducts.map((product: BrowseProduct) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="relative w-20 h-28 flex-shrink-0">
                          <div className="relative aspect-[2/3] overflow-hidden rounded bg-gray-100">
                            <Image
                              src={typeof product.display_picture === 'string' ? product.display_picture : '/placeholder.png'}
                              alt={product.product_name}
                              width={80}
                              height={120}
                              className="h-full w-full object-cover object-center"
                            />
                            {product.is_new && (
                              <span className="absolute top-1 left-1 rounded-full bg-indigo-600 px-1 py-0.5 text-xs font-medium text-white">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {product.format}
                                </span>
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-0.5">{product.product_name}</h3>
                              <p className="text-xs text-gray-600 mb-1">by {product.author}</p>
                              
                              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                <span>{product.format}</span>
                                <span>{product.stock_status}</span>
                                {typeof product.stock_count === 'number' && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-700">
                                    {product.stock_count} in stock
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">₦{product.selling_price}</div>
                                {product.nomral_price ? (
                                  <div className="text-sm text-gray-500 line-through">₦{product.nomral_price}</div>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleWishlist(product);
                                  }}
                                  className={`p-1.5 rounded transition-colors ${
                                    isInWishlist(String(product.id))
                                      ? 'bg-red-100 text-red-500'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <Heart className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={e => {
                                    e.preventDefault();
                                    if (isInCart(String(product.id))) {
                                      removeFromCart(String(product.id));
                                    } else {
                                      addToCart({
                                        productId: String(product.id),
                                        quantity: 1,
                                        price: product.selling_price,
                                        sellingPrice: product.selling_price,
                                        normalPrice: product.nomral_price ?? product.selling_price,
                                        product: {
                                          name: product.product_name,
                                          image: product.display_picture || undefined,
                                          category: product.format
                                        }
                                      });
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                    isInCart(String(product.id))
                                      ? 'bg-green-500 text-white'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {isInCart(String(product.id)) ? (
                                    <div className="flex items-center gap-1">
                                      <Check className="h-3.5 w-3.5" />
                                      Added
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <ShoppingCart className="h-3.5 w-3.5" />
                                      Add to Cart
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMoreProducts}
            disabled={isLoadingMore}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoadingMore ? <PageLoader/> : 'See More'}
          </button>
        </div>
      )}
    </>
  );
}