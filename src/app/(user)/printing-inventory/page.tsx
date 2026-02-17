"use client";

import { useState } from "react";
import { 
  Printer, 
  Package, 
  Wrench, 
  Users, 
  BarChart3, 
  Menu, 
  X, 
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Plus,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import DispatchTab from "@/app/admin/printing/components/DispatchTab";
import RepairsTab from "@/app/admin/printing/components/RepairsTab";
import WorkersTab from "@/app/admin/printing/components/WorkersTab";

const sidebarTabs = [
  { label: "Print Jobs", value: "printjobs", icon: Printer },
  { label: "Dispatch", value: "dispatch", icon: Package },
  { label: "Repairs", value: "repairs", icon: Wrench },
  { label: "Workers", value: "workers", icon: Users },
  { label: "Analytics", value: "analytics", icon: BarChart3 },
];

const PrintJobsTab = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Print Jobs</h2>
        <p className="text-gray-600">Manage and monitor all printing operations</p>
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Job
        </button>
      </div>
    </div>
    {/* KPI Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">All Time Print Jobs (This Month)</p>
            <p className="text-2xl font-bold text-blue-900">142</p>
          </div>
          <Activity className="h-8 w-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Total Copies Printed (This Month)</p>
            <p className="text-2xl font-bold text-green-900">18,500</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-600">Pending (This Month)</p>
            <p className="text-2xl font-bold text-yellow-900">7</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Total Print Jobs (Last Month)</p>
            <p className="text-2xl font-bold text-purple-900">128</p>
          </div>
          <BarChart3 className="h-8 w-8 text-purple-500" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Print Jobs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Printer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[
              { id: "PJ-001", title: "Brochure Batch A", client: "ABC Corp", qty: 2000, printer: "Heidelberg Press #1", status: "In Progress", date: "2025-07-08" },
              { id: "PJ-002", title: "Business Cards July", client: "XYZ Ltd", qty: 5000, printer: "HP Digital Press", status: "Completed", date: "2025-07-07" },
              { id: "PJ-003", title: "Tech Flyers", client: "Tech Start", qty: 3000, printer: "HP Digital Press", status: "Pending", date: "2025-07-10" },
            ].map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.printer}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AnalyticsTab = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-gray-600">Performance insights and business metrics</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        <Download className="h-4 w-4" />
        Export Report
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$45,280</p>
            <p className="text-xs text-green-600">+12.5% from last month</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Jobs Completed</p>
            <p className="text-2xl font-bold text-gray-900">127</p>
            <p className="text-xs text-blue-600">+8.3% from last month</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
            <p className="text-2xl font-bold text-gray-900">2.4 days</p>
            <p className="text-xs text-yellow-600">-0.3 days from last month</p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Equipment Uptime</p>
            <p className="text-2xl font-bold text-gray-900">96.2%</p>
            <p className="text-xs text-green-600">+2.1% from last month</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Trends</h3>
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Chart visualization would go here</p>
      </div>
    </div>
  </div>
);

export default function PrintingInventoryManagerPage() {
  const [tab, setTab] = useState("printjobs");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`
          z-30 bg-white shadow-lg flex flex-col border-r border-gray-200
          transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 w-56
          lg:static lg:inset-auto lg:w-56
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        aria-label="Sidebar navigation"
      >
        {/* Logo and Close Button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform hover:scale-110 hover:shadow-md">
              <Printer className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-lg font-bold text-white">PrintPro</span>
          </div>
          <button className="lg:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-medium text-sm">IM</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Inventory Manager</p>
              <p className="text-xs text-gray-500">manager@printpro.com</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto" aria-label="Sidebar tabs">
          {sidebarTabs.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTab(value); setSidebarOpen(false); }}
              aria-label={`Go to ${label}`}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                ${
                tab === value
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105"
                  : "text-gray-700 hover:bg-gray-100 hover:scale-105"
              }`}
            >
              <Icon className={`h-5 w-5 ${tab === value ? "text-white" : "text-gray-500 group-hover:text-gray-700"}`} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-left font-medium text-sm">
            <Settings className="h-5 w-5 text-gray-500" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, orders, equipment..."
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Notifications">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">3</span>
              </button>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">IM</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-full mx-auto w-full">
          <div className="max-w-7xl mx-auto space-y-10">
            {tab === "printjobs" && <PrintJobsTab />}
            {tab === "dispatch" && <DispatchTab />}
            {tab === "repairs" && <RepairsTab />}
            {tab === "workers" && <WorkersTab />}
            {tab === "analytics" && <AnalyticsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}