"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  MoreVertical,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import OrderDetailsModal from "@/components/modals/OrderDetailsModal";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  items: OrderItem[];
  total: number;
  amountPaid: number;
  balance: number;
  percentagePaid: number;
  shipmentStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  isRecurringCustomer: boolean;
}

// Mock data - replace with actual data from your backend
const orders: Order[] = [
  {
    id: "ORD001",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+234 123 456 7890"
    },
    date: "2024-03-15",
    items: [
      {
        id: "ITEM001",
        name: "The Great Gatsby",
        quantity: 2,
        price: 15000.00
      },
      {
        id: "ITEM002",
        name: "To Kill a Mockingbird",
        quantity: 1,
        price: 15000.00
      }
    ],
    total: 45000.00,
    amountPaid: 45000.00,
    balance: 0.00,
    percentagePaid: 100,
    shipmentStatus: "Delivered",
    paymentStatus: "Cleared",
    paymentMethod: "Card",
    shippingAddress: "123 Main St, Lagos, Nigeria",
    trackingNumber: "TRK123456789",
    estimatedDelivery: "2024-03-18",
    isRecurringCustomer: true
  },
  {
    id: "ORD002",
    customer: {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+234 987 654 3210"
    },
    date: "2024-03-14",
    items: [
      {
        id: "ITEM003",
        name: "1984",
        quantity: 1,
        price: 15000.00
      },
      {
        id: "ITEM004",
        name: "Pride and Prejudice",
        quantity: 1,
        price: 10000.00
      }
    ],
    total: 25000.00,
    amountPaid: 15000.00,
    balance: 10000.00,
    percentagePaid: 60,
    shipmentStatus: "Processing",
    paymentStatus: "Partial",
    paymentMethod: "Transfer",
    shippingAddress: "456 Park Ave, Abuja, Nigeria",
    isRecurringCustomer: true
  },
  {
    id: "ORD003",
    customer: {
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+234 555 666 7777"
    },
    date: "2024-03-13",
    items: [
      {
        id: "ITEM005",
        name: "The Catcher in the Rye",
        quantity: 1,
        price: 15000.00
      }
    ],
    total: 15000.00,
    amountPaid: 0.00,
    balance: 15000.00,
    percentagePaid: 0,
    shipmentStatus: "Shipped",
    paymentStatus: "Pending",
    paymentMethod: "Card",
    shippingAddress: "789 Oak St, Port Harcourt, Nigeria",
    isRecurringCustomer: false
  },
  {
    id: "ORD004",
    customer: {
      name: "Sarah Williams",
      email: "sarah@example.com",
      phone: "+234 111 222 3333"
    },
    date: "2024-03-12",
    items: [
      {
        id: "ITEM006",
        name: "The Hobbit",
        quantity: 2,
        price: 20000.00
      },
      {
        id: "ITEM007",
        name: "The Lord of the Rings",
        quantity: 2,
        price: 17500.00
      }
    ],
    total: 75000.00,
    amountPaid: 75000.00,
    balance: 0.00,
    percentagePaid: 100,
    shipmentStatus: "Cancelled",
    paymentStatus: "Refunded",
    paymentMethod: "Transfer",
    shippingAddress: "321 Pine Rd, Benin, Nigeria",
    isRecurringCustomer: false
  }
];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === "All" || order.shipmentStatus === selectedStatus;
      const matchesPaymentStatus = !selectedPaymentStatus || order.paymentStatus === selectedPaymentStatus;
      
      const matchesDateRange = (!dateRange.start || order.date >= dateRange.start) &&
                             (!dateRange.end || order.date <= dateRange.end);
      
      const matchesPriceRange = (!priceRange.min || order.total >= parseFloat(priceRange.min)) &&
                              (!priceRange.max || order.total <= parseFloat(priceRange.max));

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange && matchesPriceRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "items":
          comparison = a.items.length - b.items.length;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusButtonColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Shipped":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "All":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Cleared":
        return "bg-green-100 text-green-800";
      case "Partial":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 mb-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-0.5">Order Management</h1>
              <p className="text-slate-300 text-xs">Track and manage customer orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 mb-0.5">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
              <p className="text-xs text-blue-500">All time</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg border border-amber-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 mb-0.5">Processing</p>
              <p className="text-2xl font-bold text-amber-900">
                {orders.filter(o => o.shipmentStatus === "Processing").length}
              </p>
              <p className="text-xs text-amber-500">In progress</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl shadow-lg border border-purple-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600 mb-0.5">Shipped</p>
              <p className="text-2xl font-bold text-purple-900">
                {orders.filter(o => o.shipmentStatus === "Shipped").length}
              </p>
              <p className="text-xs text-purple-500">In transit</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Truck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-lg border border-emerald-200/50 p-4 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-0.5">Delivered</p>
              <p className="text-2xl font-bold text-emerald-900">
                {orders.filter(o => o.shipmentStatus === "Delivered").length}
              </p>
              <p className="text-xs text-emerald-500">Completed</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Search className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Search</h2>
              <p className="text-xs text-gray-500">Filter and search through orders</p>
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
                placeholder="Search by order ID, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              />
            </div>

            {/* Order Status Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Package className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option value="All">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <select 
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              >
                <option value="">All Payment Status</option>
                <option value="Cleared">Cleared</option>
                <option value="Partial">Partial</option>
                <option value="Refunded">Refunded</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedStatus !== "All" || selectedPaymentStatus || dateRange.start || dateRange.end || priceRange.min || priceRange.max) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Active filters:</span>
              <div className="flex items-center gap-2">
                {selectedStatus !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                    {selectedStatus}
                    <button 
                      onClick={() => setSelectedStatus("All")}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedPaymentStatus && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                    {selectedPaymentStatus}
                    <button 
                      onClick={() => setSelectedPaymentStatus("")}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(dateRange.start || dateRange.end) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                    Date Range
                    <button 
                      onClick={() => setDateRange({ start: "", end: "" })}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(priceRange.min || priceRange.max) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                    Price Range
                    <button 
                      onClick={() => setPriceRange({ min: "", max: "" })}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipment Status Filter */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedStatus === status 
                  ? `${getStatusButtonColor(status)} ring-2 ring-offset-2 ring-indigo-500 transform scale-105`
                  : `${getStatusButtonColor(status)} hover:scale-105`
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Order Details
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Total
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Amount Paid
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Balance
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    % Paid
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    Shipment Status
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment Status
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{order.id}</div>
                        <div className="text-xs text-gray-500">{order.items.length} items</div>
                        {order.isRecurringCustomer && (
                          <div className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">Recurring</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">₦{order.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">₦{order.amountPaid.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${order.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₦{order.balance.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getPercentageColor(order.percentagePaid)}`}>
                      {order.percentagePaid}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      order.shipmentStatus === 'Delivered'
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                        : order.shipmentStatus === 'Processing'
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200'
                        : order.shipmentStatus === 'Shipped'
                        ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                    }`}>
                      {order.shipmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:scale-110"
                        title="View Details"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group-hover:scale-110"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:scale-110"
                        title="More Options"
                      >
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}