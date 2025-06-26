"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, Tag, DollarSign, ShoppingBag, Edit, Trash2, MoreVertical } from "lucide-react";
import { api } from "@/services/api";
import { formatAmount } from "@/lib/utils";
import type { ProductsResponse, Product } from "@/types/admin/products/products";
import Loader from "@/components/Loader";
import BookCatalogSearchFilter from '@/components/common/BookCatalogSearchFilter';

const PRODUCTS_CACHE_PREFIX = "admin_products_all_page_";
const PRODUCTS_CACHE_TIME = 60 * 60 * 1000; // 1 hour in ms

function getCachedProducts(page: number) {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(PRODUCTS_CACHE_PREFIX + page);
  if (!cached) return null;
  try {
    const { data, totalPages, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < PRODUCTS_CACHE_TIME) {
      return { data, totalPages };
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedProducts(page: number, data: Product[], totalPages: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PRODUCTS_CACHE_PREFIX + page,
    JSON.stringify({ data, totalPages, timestamp: Date.now() })
  );
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoriesMeta, setCategoriesMeta] = useState<{ value: string, label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    api.admin.fetchMetadata().then(res => {
      setCategoriesMeta(res.data.categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })));
    });
  }, []);

  const filteredCategories = categoriesMeta.filter(cat =>
    cat.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Move fetchProducts outside useEffect so it can be called from anywhere
  const fetchProducts = async (page: number, forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    if (!forceRefresh) {
      const cached = getCachedProducts(page);
      if (cached) {
        setProducts(cached.data || []);
        setTotalPages(cached.totalPages || 1);
        setIsLoading(false);
        return;
      }
    }
    try {
      const response: ProductsResponse = await api.admin.products.getAll(page);
      if (!response.success) throw new Error(response.message || "Failed to fetch products");
      setProducts(response.data.productsTable.products || []);
      setTotalPages(response.data.productsTable.pagination.totalPages || 1);
      setCachedProducts(
        page,
        response.data.productsTable.products || [],
        response.data.productsTable.pagination.totalPages || 1
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const handleForceRefresh = () => {
    setIsRefreshing(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PRODUCTS_CACHE_PREFIX + currentPage);
    }
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await fetchProducts(currentPage, true);
    })();
  };

  if (isLoading) return <Loader title="Loading All Products" message="Please wait while we fetch all products..." />;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const filteredProducts = products.filter((book) => {
    const matchesSearch =
      (book.bookName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (Array.isArray(book.categories) ? book.categories.some((cat) => cat.name?.toLowerCase().includes(searchQuery.toLowerCase())) : false) ||
      (book.isbn?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (book.publishedBy?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      (Array.isArray(book.categories) && book.categories.some((cat) => cat.id === selectedCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
            <BookOpen className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-indigo-900 mb-0.5">All Products</h1>
            <p className="text-slate-500 text-xs">Full list of all products in your catalog</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            title="Force Refresh"
            className="inline-flex items-center justify-center p-2 rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isRefreshing ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
          <a href="/admin/products" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Back to Management
          </a>
        </div>
      </div>
      <BookCatalogSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        filteredCategories={filteredCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showSeeAllButton={false}
        headerTitle="All Products"
        headerDescription="Full list of all products in your catalog"
      />
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200/50 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Book Details
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg> ISBN
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Price
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Stock
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg> Commission
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg> Status
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg> Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {filteredProducts.map((book) => (
              <tr key={book.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {book.displayImages && book.displayImages.length > 0 ? (
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                        <Image
                          src={book.displayImages[0].secure_url}
                          alt={book.bookName}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{book.bookName}</div>
                      <div className="text-xs text-gray-500">{book.publishedBy} • {book.bookFormat}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {Array.isArray(book.categories) && book.categories.length > 0 ? (
                      book.categories.slice(0, 3).map((cat) => (
                        <span key={cat.id} className="text-xs text-gray-600">{cat.name}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No category</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">{book.isbn}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{formatAmount(book.sellingPrice || 0)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{book.stock}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">{book.referralCommission}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    book.status === 'active'
                      ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                      : book.status === 'In Stock'
                      ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                      : book.status === 'Low Stock'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200'
                      : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                  }`}>
                    {book.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:scale-110">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group-hover:scale-110">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:scale-110">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border bg-white text-gray-700 font-semibold shadow-sm hover:bg-indigo-50 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg border font-semibold shadow-sm transition-all duration-150 ${
                page === currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600 scale-105'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border bg-white text-gray-700 font-semibold shadow-sm hover:bg-indigo-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 