// Admin Dashboard Data Interfaces
export interface DashboardKPI {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
  format: 'number' | 'currency' | 'percentage';
}

export interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  items: number;
}

export interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'new';
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  sales: number;
  revenue: number;
  stock: number;
  rating: number;
}

export interface SalesData {
  labels: string[];
  sales: number[];
  revenue: number[];
  orders: number[];
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'customer' | 'system' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Mock Data
export const dashboardKPIs: DashboardKPI[] = [
  {
    title: "Total Revenue",
    value: 28450000,
    change: 12.5,
    changeType: "increase",
    icon: "DollarSign",
    color: "purple",
    format: "currency"
  },
  {
    title: "Total Orders",
    value: 1247,
    change: 8.2,
    changeType: "increase",
    icon: "ShoppingCart",
    color: "blue",
    format: "number"
  },
  {
    title: "Active Customers",
    value: 892,
    change: 15.3,
    changeType: "increase",
    icon: "Users",
    color: "green",
    format: "number"
  },
  // {
  //   title: "Conversion Rate",
  //   value: 3.2,
  //   change: -2.1,
  //   changeType: "decrease",
  //   icon: "TrendingUp",
  //   color: "orange",
  //   format: "percentage"
  // },
  {
    title: "Average Order Value",
    value: 22800,
    change: 4.7,
    changeType: "increase",
    icon: "BarChart3",
    color: "indigo",
    format: "currency"
  },
  // {
  //   title: "Return Rate",
  //   value: 2.8,
  //   change: -1.2,
  //   changeType: "decrease",
  //   icon: "RefreshCw",
  //   color: "red",
  //   format: "percentage"
  // }
];

export const recentOrders: RecentOrder[] = [
  {
    id: "ORD001",
    customerName: "Chinedu Okafor",
    customerEmail: "chinedu.okafor@gmail.com",
    orderNumber: "#ORD-2024-001",
    amount: 45000,
    status: "delivered",
    date: "2024-06-15",
    items: 3
  },
  {
    id: "ORD002",
    customerName: "Aisha Bello",
    customerEmail: "aisha.bello@yahoo.com",
    orderNumber: "#ORD-2024-002",
    amount: 32000,
    status: "shipped",
    date: "2024-06-14",
    items: 2
  },
  {
    id: "ORD003",
    customerName: "Emeka Uche",
    customerEmail: "emeka.uche@outlook.com",
    orderNumber: "#ORD-2024-003",
    amount: 78000,
    status: "processing",
    date: "2024-06-14",
    items: 5
  },
  {
    id: "ORD004",
    customerName: "Sarah Williams",
    customerEmail: "sarah@example.com",
    orderNumber: "#ORD-2024-004",
    amount: 25000,
    status: "pending",
    date: "2024-06-13",
    items: 1
  },
  {
    id: "ORD005",
    customerName: "David Brown",
    customerEmail: "david@example.com",
    orderNumber: "#ORD-2024-005",
    amount: 95000,
    status: "delivered",
    date: "2024-06-13",
    items: 4
  }
];

export const recentCustomers: RecentCustomer[] = [
  {
    id: "CUST001",
    name: "Alice Johnson",
    email: "alice@example.com",
    joinDate: "2024-03-15",
    totalOrders: 5,
    totalSpent: 125000,
    status: "new"
  },
  {
    id: "CUST002",
    name: "Bob Wilson",
    email: "bob@example.com",
    joinDate: "2024-03-14",
    totalOrders: 12,
    totalSpent: 320000,
    status: "active"
  },
  {
    id: "CUST003",
    name: "Carol Davis",
    email: "carol@example.com",
    joinDate: "2024-03-13",
    totalOrders: 3,
    totalSpent: 45000,
    status: "active"
  },
  {
    id: "CUST004",
    name: "David Miller",
    email: "david@example.com",
    joinDate: "2024-03-12",
    totalOrders: 8,
    totalSpent: 180000,
    status: "active"
  }
];

export const topProducts: TopProduct[] = [
  {
    id: "BOOK001",
    name: "The Great Gatsby",
    category: "Fiction & Literature",
    image: "/images/books/gatsby.jpg",
    sales: 234,
    revenue: 4680000,
    stock: 45,
    rating: 4.8
  },
  {
    id: "BOOK002",
    name: "Introduction to Computer Science",
    category: "Academic & Textbooks",
    image: "/images/books/cs-textbook.jpg",
    sales: 189,
    revenue: 3780000,
    stock: 67,
    rating: 4.6
  },
  {
    id: "BOOK003",
    name: "Atomic Habits",
    category: "Self-Help & Personal Development",
    image: "/images/books/atomic-habits.jpg",
    sales: 156,
    revenue: 2340000,
    stock: 89,
    rating: 4.9
  },
  {
    id: "BOOK004",
    name: "Rich Dad Poor Dad",
    category: "Business & Economics",
    image: "/images/books/rich-dad.jpg",
    sales: 123,
    revenue: 1845000,
    stock: 34,
    rating: 4.7
  }
];

export const salesData: SalesData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  sales: [120, 150, 180, 220, 280, 320],
  revenue: [12000000, 15000000, 18000000, 22000000, 28000000, 32000000],
  orders: [85, 110, 130, 160, 200, 240]
};

export const revenueBreakdown: RevenueBreakdown[] = [
  { category: "Fiction & Literature", amount: 12000000, percentage: 42, color: "#3B82F6" },
  { category: "Academic & Textbooks", amount: 8000000, percentage: 28, color: "#10B981" },
  { category: "Self-Help & Personal Development", amount: 5000000, percentage: 18, color: "#F59E0B" },
  { category: "Business & Economics", amount: 2500000, percentage: 9, color: "#EF4444" },
  { category: "Children & Young Adult", amount: 1500000, percentage: 3, color: "#8B5CF6" }
];

export const systemMetrics: SystemMetrics = {
  cpu: 65,
  memory: 78,
  storage: 45,
  network: 92
};

export const notifications: Notification[] = [
  {
    id: "NOTIF001",
    type: "order",
    title: "New Order Received",
    message: "Order #ORD-2024-006 has been placed by Chinedu Okafor",
    time: "2 minutes ago",
    read: false,
    priority: "medium"
  },
  {
    id: "NOTIF002",
    type: "customer",
    title: "New Customer Registration",
    message: "Aisha Bello has joined the platform",
    time: "5 minutes ago",
    read: false,
    priority: "low"
  },
  {
    id: "NOTIF003",
    type: "system",
    title: "System Update",
    message: "Database backup completed successfully",
    time: "10 minutes ago",
    read: true,
    priority: "low"
  },
  {
    id: "NOTIF004",
    type: "alert",
    title: "Low Stock Alert",
    message: "Wireless Headphones stock is running low",
    time: "15 minutes ago",
    read: false,
    priority: "high"
  }
]; 