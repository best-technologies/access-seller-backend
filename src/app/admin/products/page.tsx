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
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.publisher.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-gray-600 text-lg font-medium">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchProducts(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
        >
          {isRefreshing ? (
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full inline-block" />
          ) : null}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Books</p>
              <p className="text-2xl font-semibold text-gray-900">{productsData?.dashboardCards.totalBooks ?? 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{productsData?.dashboardCards.totalCategories ?? 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{productsData?.dashboardCards.inStock ?? 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">₦{((productsData?.dashboardCards.totalProductValue ?? 0) / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Books</h2>
              <p className="text-sm text-gray-500">Search and filter your book catalog</p>
            </div>
            <button
              onClick={() => setIsAddBookOptionsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add New Book
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by book name, ISBN, or publisher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select 
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none bg-white"
              >
                <option value="">All Categories</option>
                <option value="fiction">Fiction & Literature</option>
                <option value="academic">Academic & Textbooks</option>
                <option value="self-help">Self-Help & Personal Development</option>
                <option value="business">Business & Economics</option>
                <option value="children">Children & Young Adult</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select 
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none bg-white"
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Active Filters (none by default) */}
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ISBN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{book.name}</div>
                        <div className="text-sm text-gray-500">{book.publisher} • {book.format}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.isbn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₦{book.price.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      book.status === 'In Stock'
                        ? 'bg-green-100 text-green-800'
                        : book.status === 'Low Stock'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-500">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-500">
                        <MoreVertical className="h-5 w-5" />
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