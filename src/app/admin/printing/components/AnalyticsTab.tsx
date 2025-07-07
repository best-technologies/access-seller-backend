"use client";

import { useState } from "react";
import { 
  Printer, 
  Clock, 
  DollarSign,
  Package,
  Wrench
} from "lucide-react";
import { printAnalytics } from "@/data/admin/printing/mockData";

export default function AnalyticsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Period Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Print Analytics</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="3months">Last 3 Months</option>
            <option value="1month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Print Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {printAnalytics.monthlyPrintVolumes.reduce((sum, item) => sum + item.volume, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Turnaround</p>
              <p className="text-2xl font-bold text-gray-900">{printAnalytics.averageTurnaroundTime}h</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(printAnalytics.topBooksPrinted.reduce((sum, book) => sum + book.revenue, 0))}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repair Costs</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(printAnalytics.repairLogsPerMachine.reduce((sum, machine) => sum + machine.totalCost, 0))}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Print Volumes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Print Volumes</h4>
          <div className="space-y-3">
            {printAnalytics.monthlyPrintVolumes.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.volume / Math.max(...printAnalytics.monthlyPrintVolumes.map(v => v.volume))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.volume.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Book Types by Volume */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Book Types by Volume</h4>
          <div className="space-y-3">
            {printAnalytics.bookTypesByVolume.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Books Printed */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Books Printed</h4>
          <div className="space-y-3">
            {printAnalytics.topBooksPrinted.map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs text-gray-600">{book.copies.toLocaleString()} copies</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(book.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Machine Usage Rate */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Machine Usage Rate</h4>
          <div className="space-y-3">
            {printAnalytics.machineUsageRate.map((machine, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{machine.machine}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${machine.usagePercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{machine.usagePercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Repair Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Repair Statistics by Machine</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repair Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Cost per Repair
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {printAnalytics.repairLogsPerMachine.map((machine, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-gray-400" />
                      {machine.machine}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {machine.repairCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(machine.totalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(machine.totalCost / machine.repairCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 