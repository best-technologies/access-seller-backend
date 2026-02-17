// Types for admin customers API response

export interface CustomersResponse {
  success: boolean;
  message: string;
  data: {
    stats: CustomersStats;
    customers: Customer[];
  };
}

export interface CustomersStats {
  totalAdmins: number;
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalValue: number;
  totalOwed: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalOrders: number;
  totalValue: number;
  totalOwed: number;
  level: string;
  paymentPercentage: number;
  status: string;
  lastOrderDate?: string;
  allowedPartialPayment?: number; // 0-100, default 100
} 