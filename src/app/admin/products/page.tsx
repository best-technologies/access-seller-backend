"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import SuccessModal from "@/components/modals/SuccessModal";
import Loader from "@/components/Loader";
import { api } from "@/services/api";
import { formatAmount } from "@/lib/utils";
import type { ProductsResponse, Product } from "@/types/admin/products/products";
import type { Book } from "@/components/modals/AddBookModal";
import EditBookModal from '@/components/modals/EditBookModal';

const PRODUCTS_CACHE_KEY = "admin_products_cache";
const PRODUCTS_CACHE_TIME = 60 * 60 * 1000; // 1 hour in ms

function getCachedProducts() {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < PRODUCTS_CACHE_TIME) {
      console.log("Using products data from cache")
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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [productsData, setProductsData] = useState<ProductsResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoriesMeta, setCategoriesMeta] = useState<{ value: string, label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [metadata, setMetadata] = useState<any>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredCategories = categoriesMeta.filter(cat =>
    cat.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const fetchProducts = async (forceRefresh = false) => {
    // console.log('fetchProducts called, forceRefresh:', forceRefresh);
    setIsLoading(true);
    setError(null);
    if (!forceRefresh) {
      const cached = getCachedProducts();
      if (cached) {
        console.log('Using cached data');
        setProductsData(cached);
        setIsLoading(false);
        return;
      }
    }
    try {
      console.log('Fetching from API...');
      const response = await api.admin.products.getAll();
      // console.log('API response:', response);
      if (!response.success) throw new Error(response.message || "Failed to fetch products");
      // console.log('Setting products data:', response.data);
      setProductsData(response.data);
      setCachedProducts(response.data);
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // console.log('useEffect triggered');
    fetchProducts();
  }, []);

  useEffect(() => {
    api.admin.fetchMetadata().then(res => {
      setCategoriesMeta(res.data.categories.map(c => ({ value: c.id, label: c.name })));
      setMetadata(res.data);
    });
  }, []);

  const handleRefresh = () => {
    // console.log('Refresh button clicked');
    setIsRefreshing(true);
    fetchProducts(true).finally(() => setIsRefreshing(false));
  };

  // Helper to map names to IDs
  function getIds(names: string[], metaArr: { id: string, name: string }[]) {
    return names.map(name => metaArr.find(m => m.name === name)?.id).filter(Boolean);
  }

  function transformBookForBackend(book: Book) {
    return {
      name: book.name,
      description: book.description,
      qty: Number(book.qty),
      normalPrice: Number(book.normalPrice),
      sellingPrice: Number(book.sellingPrice),
      categoryIds: book.category, // already IDs
      language: metadata ? getIds(book.language, metadata.languages) : [],
      genre: metadata ? getIds(book.genre, metadata.genres) : [],
      format: metadata ? getIds(book.format, metadata.formats) : [],
      rated: book.rated,
      isbn: book.isbn,
      publisher: book.publisher,
      commission: String(book.referralCommission),
      // Send image file(s) as-is, using the key expected by backend
      coverImage: book.display_images && book.display_images.length > 0 ? book.display_images[0] : undefined
    };
  }

  const handleCreateBook = async (book: Book) => {
    setIsCreating(true);
    setError(null);
    try {
      const payload = transformBookForBackend(book);
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) formData.append(`${key}[]`, String(v));
          });
        } else if (key === 'coverImage' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await api.admin.products.create(formData) as { success: boolean; message?: string };
      if (!response.success) throw new Error(response.message || "Failed to create book");
      setIsSuccessModalOpen(true);
      setIsAddBookModalOpen(false);
      await fetchProducts(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  function productToBook(product: Product): Book {
    return {
      name: product.bookName || '',
      description: (product as any).description || '',
      qty: String(product.stock ?? ''),
      sellingPrice: String(product.sellingPrice ?? ''),
      normalPrice: String(product.normalPrice ?? ''),
      category: product.categories?.map(c => c.id) || [],
      language: (product as any).language || [],
      format: (product as any).format || [],
      genre: (product as any).genre || [],
      rated: (product as any).rated || '',
      display_images: [], // You may want to handle images separately
      isbn: product.isbn || '',
      publisher: product.publishedBy || '',
      referralCommission: product.referralCommission ?? 0,
    };
  }

  const handleEditBook = (book: Product) => {
    setEditingBook(productToBook(book));
    setEditingBookId(book.id);
    setIsEditModalOpen(true);
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    if (!editingBookId) return;
    setIsCreating(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(updatedBook).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) formData.append(`${key}[]`, String(v));
          });
        } else if (key === 'coverImage' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      await api.admin.products.update(editingBookId, formData);
      setIsEditModalOpen(false);
      setEditingBook(null);
      setEditingBookId(null);
      await fetchProducts(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update book");
    } finally {
      setIsCreating(false);
    }
  };

  // console.log('Component rendering - isLoading:', isLoading, 'productsData:', productsData);

  if (isLoading) {
    // console.log('Showing loading screen');
    return <Loader title="Loading Products" message="Please wait while we fetch your book catalog..." />;
  }

  if (error) {
    console.log('Showing error screen:', error);
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

  const books = productsData?.productsTable.products || [];
  // console.log('Books array length:', books.length);

  // Debug: Log the first book to see the data structure
  // if (books.length > 0) {
  //   console.log('First book data:', books[0]);
  //   console.log('Display images:', books[0].displayImages);
  //   console.log('Book keys:', Object.keys(books[0]));
  //   console.log('Type of displayImages:', typeof books[0].displayImages);
  //   if (books[0].displayImages) {
  //     console.log('First image object:', books[0].displayImages[0]);
  //   }
  // }

  const filteredBooks = books.filter((book: Product) => {
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

  const renderCategoryCell = (book: Product) => {
    const categories = Array.isArray(book.categories) ? book.categories : [];
    if (categories.length > 0) {
      return categories.slice(0, 3).map((cat) => (
        <span key={cat.id} className="text-xs text-gray-600">
          {cat.name}
        </span>
      ));
    } else {
      return <span className="text-xs text-gray-400">No category</span>;
    }
  };

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
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setIsAddBookModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Add New Book
            </button>
          </div>
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                />
                <select
                  className="w-full pl-10 pr-8 py-2.5 border border-t-0 border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
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
                      {book.displayImages && book.displayImages.length > 0 ? (
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                          <Image
                            src={book.displayImages[0].secure_url}
                            alt={book.bookName}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', book.displayImages?.[0]?.secure_url);
                              // Fallback to book icon
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow hidden">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          {/* Temporary fallback img tag for debugging */}
                          <Image
                            src={book.displayImages[0].secure_url}
                            alt={book.bookName}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover absolute inset-0 opacity-0 pointer-events-none"
                            onLoadingComplete={() => console.log('Image loaded successfully:', book.displayImages?.[0]?.secure_url)}
                            onError={() => console.error('Image failed to load:', book.displayImages?.[0]?.secure_url)}
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
                      {renderCategoryCell(book)}
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
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:scale-110" onClick={() => handleEditBook(book)}>
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
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onAddBook={handleCreateBook}
        isLoading={isCreating}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
      />

      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingBook(null); setEditingBookId(null); }}
        book={editingBook}
        onUpdate={handleUpdateBook}
        // isEdit={true}
        isLoading={isCreating}
      />
    </div>
  );
}