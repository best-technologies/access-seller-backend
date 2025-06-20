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
      revenueBreakdown: any[];
      recentOrders: any[];
      topBooks: any[];
      notifications: any[];
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