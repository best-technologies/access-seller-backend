"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Filter, 
  Search,
  Star, 
  Heart, 
  ShoppingCart,
  Truck,
  Clock,
  Book,
  BookOpen,
  Grid3X3,
  List,
  Eye,
  Check,
  Zap,
  Award,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";

// Enhanced mock data for books
const products = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.5,
    reviews: 1247,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop&crop=center",
    category: "Fiction",
    subcategory: "Classic Literature",
    isNew: true,
    isBestseller: true,
    discount: 17,
    shipping: "Free Shipping",
    delivery: "2-3 days",
    format: "Hardcover",
    pages: 240,
    language: "English",
    isbn: "978-0743273565",
    publishedDate: "1925",
    publisher: "Scribner",
    description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island...",
    stock: 15,
    stockStatus: "In Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    tags: ["Classic", "American Literature", "Jazz Age", "Romance"],
    awards: ["Modern Library's Top 100", "TIME's All-Time Novels"],
    dimensions: "5.5 x 8.2 inches",
    weight: "0.8 lbs"
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 18.99,
    originalPrice: 22.99,
    rating: 4.8,
    reviews: 2156,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&crop=center",
    category: "Fiction",
    subcategory: "Classic Literature",
    isNew: false,
    isBestseller: true,
    discount: 17,
    shipping: "Free Shipping",
    delivery: "1-2 days",
    format: "Paperback",
    pages: 281,
    language: "English",
    isbn: "978-0446310789",
    publishedDate: "1960",
    publisher: "Harper Perennial",
    description: "To Kill a Mockingbird is a novel by Harper Lee published in 1960. Winner of the Pulitzer Prize...",
    stock: 20,
    stockStatus: "In Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    tags: ["Pulitzer Prize", "American Literature", "Social Justice", "Coming of Age"],
    awards: ["Pulitzer Prize", "Presidential Medal of Freedom"],
    dimensions: "5.2 x 8.0 inches",
    weight: "0.6 lbs"
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    price: 16.99,
    originalPrice: 19.99,
    rating: 4.7,
    reviews: 3421,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop&crop=center",
    category: "Science Fiction",
    subcategory: "Dystopian",
    isNew: false,
    isBestseller: true,
    discount: 15,
    shipping: "Free Shipping",
    delivery: "2-3 days",
    format: "Paperback",
    pages: 328,
    language: "English",
    isbn: "978-0451524935",
    publishedDate: "1949",
    publisher: "Signet Classics",
    description: "1984 is a dystopian social science fiction novel by English novelist George Orwell...",
    stock: 25,
    stockStatus: "In Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    tags: ["Dystopian", "Political Fiction", "Surveillance", "Totalitarianism"],
    awards: ["TIME's Best English-Language Novels", "Modern Library's 100 Best"],
    dimensions: "5.1 x 7.8 inches",
    weight: "0.7 lbs"
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 14.99,
    originalPrice: 17.99,
    rating: 4.6,
    reviews: 1876,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center",
    category: "Romance",
    subcategory: "Classic Romance",
    isNew: false,
    isBestseller: false,
    discount: 17,
    shipping: "Free Shipping",
    delivery: "3-4 days",
    format: "Paperback",
    pages: 432,
    language: "English",
    isbn: "978-0141439518",
    publishedDate: "1813",
    publisher: "Penguin Classics",
    description: "Pride and Prejudice is an 1813 novel of manners written by Jane Austen...",
    stock: 12,
    stockStatus: "Low Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    tags: ["Romance", "Regency Era", "Social Commentary", "British Literature"],
    awards: ["BBC's Big Read Top 100", "Guardian's 100 Best Novels"],
    dimensions: "5.0 x 7.7 inches",
    weight: "0.9 lbs"
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    price: 21.99,
    originalPrice: 24.99,
    rating: 4.2,
    reviews: 945,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop&crop=center",
    category: "Fiction",
    subcategory: "Coming of Age",
    isNew: true,
    isBestseller: false,
    discount: 12,
    shipping: "Free Shipping",
    delivery: "2-3 days",
    format: "Hardcover",
    pages: 277,
    language: "English",
    isbn: "978-0316769174",
    publishedDate: "1951",
    publisher: "Little, Brown and Company",
    description: "The Catcher in the Rye is a novel by J. D. Salinger, partially published in serial form...",
    stock: 8,
    stockStatus: "Low Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book"],
    tags: ["Coming of Age", "American Literature", "Adolescence", "Rebellion"],
    awards: ["Modern Library's 100 Best Novels", "TIME's All-Time 100 Novels"],
    dimensions: "5.5 x 8.2 inches",
    weight: "1.0 lbs"
  },
  {
    id: 6,
    title: "Dune",
    author: "Frank Herbert",
    price: 19.99,
    originalPrice: 24.99,
    rating: 4.9,
    reviews: 4567,
    image: "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400&h=600&fit=crop&crop=center",
    category: "Science Fiction",
    subcategory: "Space Opera",
    isNew: false,
    isBestseller: true,
    discount: 20,
    shipping: "Free Shipping",
    delivery: "1-2 days",
    format: "Paperback",
    pages: 688,
    language: "English",
    isbn: "978-0441172719",
    publishedDate: "1965",
    publisher: "Ace Books",
    description: "Dune is a 1965 science fiction novel by American author Frank Herbert...",
    stock: 30,
    stockStatus: "In Stock",
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    tags: ["Space Opera", "Ecology", "Politics", "Religion"],
    awards: ["Hugo Award", "Nebula Award", "Locus Award"],
    dimensions: "4.2 x 6.9 inches",
    weight: "1.2 lbs"
  }
];

// Enhanced categories data
const categories = [
  { id: 'all', name: "All Books", count: 1247, icon: BookOpen },
  { id: 'fiction', name: "Fiction", count: 456, icon: Book },
  { id: 'non-fiction', name: "Non-Fiction", count: 343, icon: Book },
  { id: 'science-fiction', name: "Science Fiction", count: 189, icon: Zap },
  { id: 'romance', name: "Romance", count: 167, icon: Heart },
  { id: 'mystery', name: "Mystery & Thriller", count: 234, icon: Eye },
  { id: 'biography', name: "Biography", count: 134, icon: Users },
  { id: 'history', name: "History", count: 198, icon: Calendar },
  { id: 'self-help', name: "Self-Help", count: 156, icon: TrendingUp }
];

const filters = {
  format: ['Hardcover', 'Paperback', 'E-Book', 'Audiobook'],
  rating: ['4+ Stars', '3+ Stars', '2+ Stars', '1+ Stars'],
  price: ['Under $15', '$15 - $25', '$25 - $35', 'Over $35'],
  availability: ['In Stock', 'Pre-order', 'Coming Soon'],
  features: ['New Arrivals', 'Bestsellers', 'Award Winners', 'On Sale']
};

export default function ProfessionalProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const { cart, addToCart, removeFromCart } = useCart();

  const toggleWishlist = (productId: number) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  const isInCart = (productId: number) => cart.some(item => item.productId === String(productId));

  const filteredProducts = products.filter(product => {
    if (selectedCategory !== "all" && product.category.toLowerCase() !== selectedCategory) {
      return false;
    }
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !product.author.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader title="Browse Books" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Discover Books</h1>
                  <p className="text-sm text-gray-600">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'book' : 'books'} available
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search books, authors, genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <div className={`w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-32 space-y-6">
                {/* Categories */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    Categories
                  </h2>
                  <div className="space-y-1">
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                            selectedCategory === category.id
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                              : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="flex-1 text-left">{category.name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Format Filter */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Format</h3>
                  <div className="space-y-3">
                    {filters.format.map((format) => (
                      <label key={format} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {filters.price.map((range) => (
                        <label key={range} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="price" 
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" 
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{range}</span>
                        </label>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Rating</h3>
                  <div className="space-y-3">
                    {filters.rating.map((rating) => (
                      <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(4)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{rating}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid/List */}
            <div className="flex-1">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                      <Link href={`/products/${product.id}-${product.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <div className="relative overflow-hidden">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.title}
                              width={400}
                              height={600}
                              className="h-full w-full object-cover object-center"
                            />
                            {product.isNew && (
                              <span className="absolute top-2 left-2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                                New
                              </span>
                            )}
                            {product.isBestseller && (
                              <span className="absolute top-2 right-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-medium text-yellow-900">
                                Bestseller
                              </span>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(product.id);
                              }}
                              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                                wishlist.has(product.id) 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                              }`}
                            >
                              <Heart className="h-5 w-5" />
                            </button>
                            <button className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-indigo-600 transition-colors">
                              <Eye className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Stock Status */}
                          <div className="absolute bottom-3 left-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm ${
                              product.stockStatus === 'In Stock' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.stockStatus}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="mb-3">
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                              {product.category}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {product.title}
                          </h3>
                          <p className="text-gray-600 mb-3">by {product.author}</p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.rating) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                            <span className="text-sm text-gray-500">({product.reviews.toLocaleString()})</span>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                            {product.originalPrice && (
                              <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                            <div className="flex items-center gap-1">
                              <Book className="h-4 w-4" />
                              <span>{product.format}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              <span>{product.delivery}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="px-6 pb-6">
                        <button
                          onClick={() => isInCart(product.id)
                            ? removeFromCart(String(product.id))
                            : addToCart({
                                productId: String(product.id),
                                quantity: 1,
                                price: product.price,
                                product: {
                                  name: product.title,
                                  image: product.image,
                                  category: product.category
                                }
                              })}
                          className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                            isInCart(product.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
                          }`}
                        >
                          {isInCart(product.id) ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="h-4 w-4" />
                              Added to Cart
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              Add to Cart
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-6 p-6">
                        <div className="relative w-32 h-48 flex-shrink-0">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.title}
                              width={400}
                              height={600}
                              className="h-full w-full object-cover object-center"
                            />
                            {product.isNew && (
                              <span className="absolute top-2 left-2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                                New
                              </span>
                            )}
                            {product.isBestseller && (
                              <span className="absolute top-2 right-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-medium text-yellow-900">
                                Bestseller
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                                  {product.category}
                                </span>
                                {product.isBestseller && (
                                  <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    Bestseller
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">{product.title}</h3>
                              <p className="text-gray-600 mb-2">by {product.author}</p>
                              
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < Math.floor(product.rating) 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                                <span className="text-sm text-gray-500">({product.reviews.toLocaleString()})</span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-1">
                                  <Book className="h-4 w-4" />
                                  <span>{product.format}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Truck className="h-4 w-4" />
                                  <span>{product.delivery}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{product.stockStatus}</span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {product.description}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">${product.price}</div>
                                {product.originalPrice && (
                                  <div className="text-lg text-gray-500 line-through">${product.originalPrice}</div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleWishlist(product.id)}
                                  className={`p-2 rounded-full transition-colors ${
                                    wishlist.has(product.id)
                                      ? 'bg-red-100 text-red-500'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <Heart className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => isInCart(product.id)
                                    ? removeFromCart(String(product.id))
                                    : addToCart({
                                        productId: String(product.id),
                                        quantity: 1,
                                        price: product.price,
                                        product: {
                                          name: product.title,
                                          image: product.image,
                                          category: product.category
                                        }
                                      })}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    isInCart(product.id)
                                      ? 'bg-green-500 text-white'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {isInCart(product.id) ? (
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4" />
                                      Added
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <ShoppingCart className="h-4 w-4" />
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
    </>
  );
}