// Product interface placeholder
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  commissionRate: number;
  referralCommission: number;
  allowedMarketers?: string[]; // IDs of marketers allowed to promote this product
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// DTOs for /products/browse API response
export interface BrowseProductsResponse {
  success: boolean;
  message: string;
  data: BrowseProductsData;
}

export interface BrowseProductsData {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  categories: BrowseCategory[];
  formats: BrowseFormat[];
  products: BrowseProduct[];
}

export interface BrowseCategory {
  id: string;
  name: string;
  total_books: number;
  icon?: string;
}

export interface BrowseFormat {
  id: string;
  name: string;
  total_books: number;
}

export interface BrowseProduct {
  id: string;
  product_name: string;
  is_new: boolean;
  stock_status: string;
  display_picture: string | null;
  author: string;
  total_sold: number;
  selling_price: number;
  nomral_price: number;
  format: string;
  stock_count: number;
  categories: { id: string; name: string }[];
  formats: { id: string; name: string }[];
}

export interface ProductUI {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  amountSaved?: number;
  stock: number;
  images: string[];
  category: string;
  categoryId?: string;
  commission?: number;
  isActive?: boolean;
  status?: string;
  isbn?: string;
  publisher?: string;
  format?: string[];
  availableFormats?: string[];
  language?: string[];
  genre?: string[];
  createdAt?: string;
  updatedAt?: string;
  features?: string[];
  rating?: number;
  reviews?: number;
  specifications?: Record<string, string>;
  isNew?: boolean;
  author?: string;
  discount?: number;
}
