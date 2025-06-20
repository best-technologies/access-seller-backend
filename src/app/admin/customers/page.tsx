"use client";

import { useState, useEffect } from "react";
import {
  Search,
  X,
  User,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  Eye,
  MoreVertical,
  ArrowUpDown,
  DollarSign,
  MapPin,
  SlidersHorizontal,
  Download,
  Plus
} from "lucide-react";
import type { CustomersResponse, Customer, CustomersStats } from '@/types/admin/customers/customers';
import { api } from '@/services/api';

const CUSTOMERS_CACHE_KEY = "admin_customers_cache";
const CUSTOMERS_CACHE_TIME = 60 * 60 * 1000; // 1 hour in ms

function getCachedCustomers() {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(CUSTOMERS_CACHE_KEY);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CUSTOMERS_CACHE_TIME) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedCustomers(data: CustomersResponse["data"]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CUSTOMERS_CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

function getMinPaymentPercentage(level: string): number {
  switch (level.toLowerCase()) {
    case "bronze":
      return 75;
    case "silver":
      return 50;
    case "gold":
      return 25;
    case "platinum":
    case "vip":
      return 0;
    default:
      return 0;
  }
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("joinDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [spendRange, setSpendRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [customersData, setCustomersData] = useState<CustomersResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCustomers = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    if (!forceRefresh) {
      const cached = getCachedCustomers();
      if (cached) {
        setCustomersData(cached);
        setIsLoading(false);
        return;
      }
    }
    try {
      const response = await api.admin.customers();
      if (!response.success) throw new Error(response.message || "Failed to fetch customers");
      setCustomersData(response.data);
      setCachedCustomers(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCustomers(true).finally(() => setIsRefreshing(false));
  };

  const customers: Customer[] = customersData?.customers || [];
  const stats: CustomersStats | undefined = customersData?.stats;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-gray-600 text-lg font-medium">Loading customers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchCustomers(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = 
        customer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);
      
      const matchesStatus = selectedStatus === "All" || customer.status === selectedStatus;
      
      const matchesDateRange = (!dateRange.start || customer.joinDate >= dateRange.start) &&
                             (!dateRange.end || customer.joinDate <= dateRange.end);
      
      const matchesSpendRange = (!spendRange.min || customer.totalValue >= parseFloat(spendRange.min)) &&
                              (!spendRange.max || customer.totalValue <= parseFloat(spendRange.max));

      return matchesSearch && matchesStatus && matchesDateRange && matchesSpendRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "joinDate":
          comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
          break;
        case "totalValue":
          comparison = a.totalValue - b.totalValue;
          break;
        case "totalOrders":
          comparison = a.totalOrders - b.totalOrders;
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "VIP":
        return "bg-purple-100 text-purple-800";
      case "Platinum":
        return "bg-gray-100 text-gray-800";
      case "Gold":
        return "bg-yellow-100 text-yellow-800";
      case "Silver":
        return "bg-gray-100 text-gray-600";
      case "Bronze":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "VIP":
        return "👑";
      case "Platinum":
        return "💎";
      case "Gold":
        return "🥇";
      case "Silver":
        return "🥈";
      case "Bronze":
        return "🥉";
      default:
        return "👤";
    }
  };

  const getPaymentPercentageColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getPaymentPercentageBg = (percentage: number) => {
    if (percentage === 100) return "bg-green-50";
    if (percentage >= 75) return "bg-blue-50";
    if (percentage >= 50) return "bg-yellow-50";
    if (percentage >= 25) return "bg-orange-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer information</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Total Admins Card (now first) */}
        <div className="bg-gradient-to-br from-teal-50 to-indigo-50 rounded-xl shadow-sm border border-teal-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 font-medium">Total Admins</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalAdmins ?? 0}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <User className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalCustomers ?? 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.activeCustomers ?? 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border border-purple-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalOrders ?? 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">₦{(stats?.totalValue ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Owed</p>
              <p className="text-2xl font-semibold text-gray-900">₦{(stats?.totalOwed ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showFilters
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(dateRange.start || dateRange.end || spendRange.min || spendRange.max) && (
                <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Join Date Range</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">From</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">To</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spend Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Spend Range</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">Min Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
                      <input
                        type="number"
                        value={spendRange.min}
                        onChange={(e) => setSpendRange({ ...spendRange, min: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">Max Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
                      <input
                        type="number"
                        value={spendRange.max}
                        onChange={(e) => setSpendRange({ ...spendRange, max: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedStatus !== "All" || dateRange.start || dateRange.end || spendRange.min || spendRange.max) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Active filters:</span>
              <div className="flex items-center gap-2">
                {selectedStatus !== "All" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700">
                    {selectedStatus}
                    <button 
                      onClick={() => setSelectedStatus("All")}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
                {(dateRange.start || dateRange.end) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700">
                    Join Date Range
                    <button 
                      onClick={() => setDateRange({ start: "", end: "" })}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
                {(spendRange.min || spendRange.max) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700">
                    Spend Range
                    <button 
                      onClick={() => setSpendRange({ min: "", max: "" })}
                      className="ml-1 hover:text-indigo-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {["All", "Active", "Inactive", "New", "VIP"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  selectedStatus === tab
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                {tab}
                {tab !== "All" && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedStatus === tab
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {customers.filter(c => c.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("joinDate")}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("totalOrders")}
                >
                  <div className="flex items-center gap-1">
                    Orders
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("totalValue")}
                >
                  <div className="flex items-center gap-1">
                    Total
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowed %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 mr-2 text-indigo-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2 text-indigo-400" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                        {customer.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.joinDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                    {customer.lastOrderDate && (
                      <div className="text-xs text-gray-500">Last: {customer.lastOrderDate}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₦{customer.totalValue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${customer.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₦{customer.totalOwed.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getLevelIcon(customer.level)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(customer.level)}`}>
                        {customer.level}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const minPercent = getMinPaymentPercentage(customer.level);
                      return (
                        <>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentPercentageBg(minPercent)} ${getPaymentPercentageColor(minPercent)}`}>
                            {minPercent}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {minPercent === 100 ? "Full payment" : 
                              minPercent >= 75 ? "High partial" :
                              minPercent >= 50 ? "Medium partial" :
                              minPercent >= 25 ? "Low partial" : "Minimal payment"}
                          </div>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customer.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="More Options"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
        >
          {isRefreshing ? (
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full inline-block" />
          ) : null}
          Refresh
        </button>
      </div>
    </div>
  );
} 