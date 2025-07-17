"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { api } from "@/services/api";
import { ArrowLeft, Box, RefreshCw, Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { CategoryProduct } from "@/types/product";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Navbar from "@/components/home/Navbar";
import ProductSearchBar from '@/components/common/ProductSearchBar';

// Type guard for CategoryProduct
function isCategoryProduct(obj: unknown): obj is CategoryProduct {
  return (
    typeof obj === 'object' && obj !== null &&
    typeof (obj as CategoryProduct).id === 'string' &&
    typeof (obj as CategoryProduct).book_name === 'string' &&
    typeof (obj as CategoryProduct).selling_price === 'number' &&
    typeof (obj as CategoryProduct).normal_price === 'number' &&
    typeof (obj as CategoryProduct).display_image === 'string'
  );
}

export default function CategoryProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { cart, addToCart, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isInCart = (productId: string) => cart.some(item => item.productId === productId);

  // Parse category name from query string (e.g., ?General%20Reading)
  const categoryName = decodeURIComponent(
    Array.from(searchParams.keys())[0] || ""
  );

  const fetchCategoryProducts = async (pageToFetch = 1) => {
    if (!categoryName) return;
    if (pageToFetch === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    try {
      const response = await api.public.getProductsByCategory(categoryName, pageToFetch, 20);
      if (response.success) {
        setHasMore(response.data.hasMore);
        // Filter/convert to CategoryProduct[]
        const filteredProducts = Array.isArray(response.data.products)
          ? response.data.products.filter(isCategoryProduct) as unknown as CategoryProduct[]
          : [];
        if (pageToFetch === 1) {
          setProducts(filteredProducts);
        } else {
          setProducts((prev) => [...prev, ...filteredProducts]);
        }
        setPage(pageToFetch); // <-- update page only after successful fetch
      } else {
        setError("No products found for this category.");
      }
    } catch {
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCategoryProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    fetchCategoryProducts(page + 1);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchCategoryProducts(1);
    toast.success("Products refreshed successfully");
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 300; // 300px from bottom
    if (scrollPosition >= threshold) {
      handleLoadMore();
    }
  }, [isLoadingMore, isLoading, hasMore, handleLoadMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Navbar />
      <div className="flex flex-col w-full items-center mt-4 mb-6">
        <ProductSearchBar className="w-full max-w-2xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <Loader />
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="bg-indigo-50 rounded-full p-6 mb-6">
              <Box className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => {
                const safeName = product.book_name
                  ? product.book_name.toLowerCase().replace(/\s+/g, "-")
                  : "no-name";
                const slug = `${product.id}-${safeName}`;
                const sellingPrice = product.selling_price || 0;
                const normalPrice = product.normal_price || 0;
                const discount =
                  normalPrice > sellingPrice && sellingPrice !== 0
                    ? Math.round(100 * (1 - sellingPrice / normalPrice))
                    : undefined;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${slug}`}
                    className="group relative block transition-all duration-300 hover:scale-105"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 h-full flex flex-col">
                      <div className="w-full h-[170px] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                          style={{
                            backgroundImage: `url(${typeof product.display_image === "string" ? product.display_image : "/placeholder.png"})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        {discount && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            -{discount}% OFF
                          </div>
                        )}
                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex flex-row gap-2 z-10">
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              const productId = String(product.id);
                              if (isInWishlist(productId)) {
                                removeFromWishlist(productId);
                                // toast.success(`${product.book_name} removed from wishlist`);
                              } else {
                                addToWishlist({
                                  id: productId,
                                  title: product.book_name,
                                  author: product.author || 'Unknown Author',
                                  price: product.selling_price || product.normal_price || 0,
                                  image: typeof product.display_image === 'string' ? product.display_image : '/placeholder.png',
                                  category: product.category && Array.isArray(product.category) && product.category.length > 0 ? product.category[0].name : '',
                                  isNew: false
                                });
                                // toast.success(`${product.book_name} added to wishlist`);
                              }
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
                              const productId = String(product.id);
                              if (isInCart(productId)) {
                                removeFromCart(productId);
                              } else {
                                addToCart({
                                  productId: productId,
                                  quantity: 1,
                                  price: Number(product.selling_price || product.normal_price || 0),
                                  sellingPrice: Number(product.selling_price || product.normal_price || 0),
                                  normalPrice: Number(product.normal_price || 0),
                                  product: {
                                    name: product.book_name,
                                    image: typeof product.display_image === 'string' ? product.display_image : '/placeholder.png',
                                    category: product.category && Array.isArray(product.category) && product.category.length > 0 ? product.category[0].name : ''
                                  }
                                });
                              }
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
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                            {/* If you want to show all categories: */}
                            {product.category && Array.isArray(product.category) && product.category.length > 0
                              ? product.category.map((cat) => cat.name).join(", ")
                              : ""}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {product.book_name}
                        </h3>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-indigo-600">
                              ₦{(product.selling_price || product.normal_price || 0).toLocaleString()}
                            </span>
                            {product.normal_price > (product.selling_price || 0) && product.selling_price !== 0 && (
                              <span className="text-sm text-gray-400 line-through">
                                ₦{product.normal_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {isLoadingMore && (
              <div className="flex justify-center mt-8">
                <span className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Loading...
                    </>
                  ) : (
                    <>Load More Books</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 