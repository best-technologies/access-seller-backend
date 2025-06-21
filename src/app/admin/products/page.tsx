"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
  Tag,
  DollarSign,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import AddBookModal from "@/components/modals/AddBookModal";
import AddBookOptionsModal from "@/components/modals/AddBookOptionsModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { api } from "@/services/api";
import { formatAmount } from "@/lib/utils";
import type { ProductsResponse } from "@/types/admin/products/products";

const PRODUCTS_CACHE_KEY = "admin_products_cache";
const PRODUCTS_CACHE_TIME = 60 * 60 * 1000; // 1 hour in ms

function getCachedProducts() {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < PRODUCTS_CACHE_TIME) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedProducts(data: ProductsResponse["data"]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PRODUCTS_CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

interface Book {
  name: string;
  description: string;
  qty: number;
  sellingPrice: number;
  normalPrice: number;
  category: string;
  language: string;
  format: string;
  genre: string;
  rated: string;
  coverImage: string;
  isbn: string;
  publisher: string;
  referralCommission: number;
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddBookOptionsModalOpen, setIsAddBookOptionsModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addedBooks, setAddedBooks] = useState<Book[]>([]);
  const [productsData, setProductsData] = useState<ProductsResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProducts = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    if (!forceRefresh) {
      const cached = getCachedProducts();
      if (cached) {
        setProductsData(cached);
        setIsLoading(false);
        return;
      }
    }
    try {
      const response = await api.admin.products();
      if (!response.success) throw new Error(response.message || "Failed to fetch products");
      setProductsData(response.data);
      setCachedProducts(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts(true).finally(() => setIsRefreshing(false));
  };

  const books = productsData?.productsTable.products || [];

  const filteredBooks = books.filter(book =>
    (book.bookName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (book.categoryId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (book.isbn?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (book.publishedBy?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleAddBook = (book: Book) => {
    setAddedBooks([book, ...addedBooks]);
  };

  const handleProceed = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsAddBookModalOpen(false);
    setIsSuccessModalOpen(true);
    setAddedBooks([]);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  const handleFileUpload = async () => {
    setIsLoading(true);
    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsLoading(false);
    setIsAddBookOptionsModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-200/50">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-400 opacity-20" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Products</h2>
            <p className="text-gray-600">Please wait while we fetch your book catalog...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200/50 max-w-md">
          <div className="mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          <button
            onClick={() => fetchProducts(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 mb-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-0.5">Book Management</h1>
              <p className="text-slate-300 text-xs">Manage your book catalog and inventory</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 shadow-lg"
          >
            {isRefreshing ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 mb-0.5">Total Books</p>
              <p className="text-2xl font-bold text-blue-900">{productsData?.dashboardCards.totalBooks ?? 0}</p>
              <p className="text-xs text-blue-500">In catalog</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl shadow-lg border border-purple-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600 mb-0.5">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{productsData?.dashboardCards.totalCategories ?? 0}</p>
              <p className="text-xs text-purple-500">Available</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Tag className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-lg border border-emerald-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-0.5">In Stock</p>
              <p className="text-2xl font-bold text-emerald-900">{productsData?.dashboardCards.inStock ?? 0}</p>
              <p className="text-xs text-emerald-500">Available items</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg border border-amber-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 mb-0.5">Total Value</p>
              <p className="text-2xl font-bold text-amber-900">{formatAmount(productsData?.dashboardCards.totalProductValue || 0, { compact: true })}</p>
              <p className="text-xs text-amber-500">Inventory worth</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Search className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Book Catalog</h2>
                <p className="text-xs text-gray-500">Search and filter your book collection</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddBookOptionsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Book</span>
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by book name, ISBN, or publisher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select 
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option value="">All Categories</option>
                <option value="academic">Academic</option>
                <option value="adventure">Adventure</option>
                <option value="arts">Arts</option>
                <option value="biography">Biography</option>
                <option value="business">Business</option>
                <option value="children">Children</option>
                <option value="comics">Comics</option>
                <option value="cooking">Cooking</option>
                <option value="dictionary">Dictionary</option>
                <option value="drama">Drama</option>
                <option value="economics">Economics</option>
                <option value="encyclopedia">Encyclopedia</option>
                <option value="fantasy">Fantasy</option>
                <option value="fiction">Fiction</option>
                <option value="graphic_novels">Graphic Novels</option>
                <option value="health">Health</option>
                <option value="history">History</option>
                <option value="horror">Horror</option>
                <option value="humor">Humor</option>
                <option value="literature">Literature</option>
                <option value="magazine">Magazine</option>
                <option value="mystery">Mystery</option>
                <option value="newspaper">Newspaper</option>
                <option value="non_fiction">Non-Fiction</option>
                <option value="other">Other</option>
                <option value="philosophy">Philosophy</option>
                <option value="poetry">Poetry</option>
                <option value="politics">Politics</option>
                <option value="psychology">Psychology</option>
                <option value="reference">Reference</option>
                <option value="religion">Religion</option>
                <option value="romance">Romance</option>
                <option value="science">Science</option>
                <option value="science_fiction">Science Fiction</option>
                <option value="self_help">Self-Help</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
                <option value="textbook">Textbook</option>
                <option value="thriller">Thriller</option>
                <option value="travel">Travel</option>
                <option value="western">Western</option>
                <option value="young_adult">Young Adult</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <select 
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Book Details
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Category
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ISBN
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Price
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Stock
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Commission
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{book.bookName}</div>
                        <div className="text-xs text-gray-500">{book.publishedBy} • {book.bookFormat}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{book.categoryId}</div>
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
      </div>

      {/* Modals */}
      <AddBookOptionsModal
        isOpen={isAddBookOptionsModalOpen}
        onClose={() => setIsAddBookOptionsModalOpen(false)}
        onManualEntry={() => {
          setIsAddBookOptionsModalOpen(false);
          setIsAddBookModalOpen(true);
        }}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
      />

      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onAddBook={handleAddBook}
        onProceed={handleProceed}
        books={addedBooks}
        isLoading={isLoading}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
} 