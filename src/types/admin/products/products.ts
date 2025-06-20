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
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  isbn: string;
  publisher: string;
  format: string;
  // Add more fields as needed
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
} 