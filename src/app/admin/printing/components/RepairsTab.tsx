"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  Wrench, 
  User, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { repairLogs, Repair } from "@/data/admin/printing/mockData";

export default function RepairsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter repair logs based on search and filters
  const filteredRepairs = repairLogs.filter(repair => {
    const matchesSearch = repair.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.faultDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.loggedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    const matchesMachine = machineFilter === "all" || repair.machineName === machineFilter;

    return matchesSearch && matchesStatus && matchesMachine;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fixed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount);
  };

  const handleViewDetails = (repair: Repair) => {
    setSelectedRepair(repair);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Repairs (This Month)</p>
              <p className="text-2xl font-bold text-blue-900">34</p>
            </div>
            <Wrench className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Fixed</p>
              <p className="text-2xl font-bold text-green-900">20</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">8</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Pending</p>
              <p className="text-2xl font-bold text-red-900">6</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="fixed">Fixed</option>
          </select>

          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Machines</option>
            <option value="HP Indigo 7900">HP Indigo 7900</option>
            <option value="Canon imagePRESS C10000">Canon imagePRESS C10000</option>
            <option value="Braille Embosser Pro">Braille Embosser Pro</option>
          </select>

          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Repairs & Maintenance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repair ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fault Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logged By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repair Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRepairs.map((repair) => (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {repair.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400" />
                      {repair.machineName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={repair.faultDescription}>
                      {repair.faultDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {repair.loggedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(repair.dateReported)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                      {repair.status.replace('_', ' ').charAt(0).toUpperCase() + repair.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repair.assignedTechnician || "Not Assigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {repair.repairCost > 0 ? formatCurrency(repair.repairCost) : "Not set"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(repair)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Repair Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Repair ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Machine Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.machineName}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Fault Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.faultDescription}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logged By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.loggedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Reported</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRepair.dateReported)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRepair.status)}`}>
                    {selectedRepair.status.replace('_', ' ').charAt(0).toUpperCase() + selectedRepair.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedRepair.priority)}`}>
                    {selectedRepair.priority.charAt(0).toUpperCase() + selectedRepair.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Technician</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.assignedTechnician || "Not Assigned"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Repair Cost</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRepair.repairCost > 0 ? formatCurrency(selectedRepair.repairCost) : "Not set"}
                  </p>
                </div>
                {selectedRepair.startDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRepair.startDate)}</p>
                  </div>
                )}
                {selectedRepair.completionDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRepair.completionDate)}</p>
                  </div>
                )}
              </div>
              
              {selectedRepair.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRepair.notes}</p>
                </div>
              )}
              
              {selectedRepair.invoice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice</label>
                  <p className="mt-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer underline">
                    {selectedRepair.invoice}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 