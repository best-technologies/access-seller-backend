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
  categoryId: string;
  isbn: string;
  sellingPrice: number;
  normalPrice: number;
  stock: number;
  status: string;
  referralCommission?: number;
  // Add more fields as needed
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
} 