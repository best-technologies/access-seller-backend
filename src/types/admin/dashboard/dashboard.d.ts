export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    dashboard: {
      kpis: {
        title: string;
        value: number;
        change: number;
        changeType: "increase" | "decrease";
        icon: string;
        color: string;
        format: string;
      }[];
      salesData: {
        labels: string[];
        sales: number[];
        revenue: number[];
        orders: number[];
      };
      revenueBreakdown: unknown[];
      recentOrders: unknown[];
      topBooks: unknown[];
      notifications: unknown[];
      recentCustomers: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        joinDate: string;
        totalOrders: number;
        totalSpent: number;
        status: string;
      }[];
    };
    metadata: {
      lastUpdated: string;
      timezone: string;
      currency: string;
      currencySymbol: string;
    };
  };
}

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  items: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  date: string;
}

export interface DashboardNotification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface DashboardProduct {
  id: string;
  name: string;
  category: string;
  rating: number;
  sales: number;
  revenue: number;
  stock: number;
}