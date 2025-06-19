import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { salesData, revenueBreakdown } from "@/data/admin/dashboard/mockData";

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
            <p className="text-sm text-gray-500">Monthly sales and revenue trends</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </select>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Sales performance chart</p>
            <p className="text-sm text-gray-400">Chart.js or Recharts integration</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-lg font-semibold text-gray-900">
              {salesData.sales[salesData.sales.length - 1]}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-lg font-semibold text-gray-900">
              ₦{(salesData.revenue[salesData.revenue.length - 1] / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-lg font-semibold text-gray-900">
              {salesData.orders[salesData.orders.length - 1]}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
            <p className="text-sm text-gray-500">Revenue by book category</p>
          </div>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <PieChart className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="space-y-4">
          {revenueBreakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  <p className="text-xs text-gray-500">₦{(item.amount / 1000000).toFixed(1)}M</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Revenue</span>
            <span className="text-lg font-semibold text-gray-900">
              ₦{(revenueBreakdown.reduce((sum, item) => sum + item.amount, 0) / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 