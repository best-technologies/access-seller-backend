// Types for admin products API response

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    dashboardCards: {
      totalBooks: number;
      totalCategories: number;
      inStock: number;
      totalProductValue: number;
    };
    productsTable: {
      products: Product[];
      pagination: Pagination;
    };
  };
}

export interface Product {
  id: string;
  bookName: string;
  publishedBy: string;
  bookFormat: string;
  categories: { id: string; name: string }[];
  isbn: string;
  sellingPrice: number | string;
  normalPrice: number | string;
  stock: number | string;
  status: string;
  referralCommission?: number;
  displayImages?: Array<{
    secure_url: string;
    public_id?: string;
  }>;
  // Add more fields as needed
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
} 