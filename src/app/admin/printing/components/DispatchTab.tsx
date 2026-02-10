"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  MapPin, 
  Package,
  User,
  Building,
  Warehouse,
  X
} from "lucide-react";
import { dispatchRecords, Dispatch } from "@/data/admin/printing/mockData";

export default function DispatchTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter dispatch records based on search and filters
  const filteredDispatch = dispatchRecords.filter(dispatch => {
    const matchesSearch = dispatch.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispatch.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispatch.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || dispatch.status === statusFilter;
    const matchesDestination = destinationFilter === "all" || dispatch.destinationType === destinationFilter;

    return matchesSearch && matchesStatus && matchesDestination;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "in_transit": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case "person": return <User className="h-4 w-4 text-gray-400" />;
      case "school": return <Building className="h-4 w-4 text-gray-400" />;
      case "warehouse": return <Warehouse className="h-4 w-4 text-gray-400" />;
      default: return <MapPin className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleViewDetails = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowDetailsModal(true);
  };
  return (
    <section className="space-y-8">
      {/* Section Heading */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Dispatch Records</h2>
        <p className="text-gray-500 mt-1 text-sm">View and manage all dispatches. Use the filters to narrow down results.</p>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Dispatches</p>
              <p className="text-2xl font-bold text-blue-900">82</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <Package className="h-6 w-6 text-blue-600 bg-blue-100 p-2 rounded-full" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Delivered</p>
              <p className="text-2xl font-bold text-green-900">65</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <Truck className="h-6 w-6 text-green-600 bg-green-100 p-2 rounded-full" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">In Transit</p>
              <p className="text-2xl font-bold text-yellow-900">12</p>
              <p className="text-xs text-gray-500 mt-1">Currently</p>
            </div>
            <MapPin className="h-6 w-6 text-yellow-600 bg-yellow-100 p-2 rounded-full" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Failed Deliveries</p>
              <p className="text-2xl font-bold text-red-900">5</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <X className="h-6 w-6 text-red-600 bg-red-100 p-2 rounded-full" />
          </div>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dispatch..."
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
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Destinations</option>
            <option value="person">Person</option>
            <option value="school">School</option>
            <option value="warehouse">Warehouse</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>
      {/* Dispatch Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Dispatch Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dispatch ID</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Book Title</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Quantity</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Destination</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Location</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dispatch Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Transporter</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDispatch.map((dispatch) => (
                <tr key={dispatch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{dispatch.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{dispatch.bookTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{dispatch.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    <div className="flex items-center gap-2">
                      {getDestinationIcon(dispatch.destinationType)}
                      <span className="capitalize">{dispatch.destinationType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {dispatch.city}, {dispatch.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatDate(dispatch.dispatchDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      {dispatch.transporterName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispatch.status)}`}>{dispatch.status.replace('_', ' ').charAt(0).toUpperCase() + dispatch.status.replace('_', ' ').slice(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetails(dispatch)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" title="View Details"><Eye className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* View Details Modal */}
      {showDetailsModal && selectedDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dispatch Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Dispatch ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.bookTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.destination}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedDispatch.destinationType.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.city}, {selectedDispatch.state}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dispatch Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedDispatch.dispatchDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedDispatch.expectedDeliveryDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transporter</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.transporterName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.vehicleNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispatch.status)}`}>
                    {selectedDispatch.status.replace('_', ' ').charAt(0).toUpperCase() + selectedDispatch.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                {selectedDispatch.trackingNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDispatch.trackingNumber}</p>
                  </div>
                )}
                {selectedDispatch.actualDeliveryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actual Delivery Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedDispatch.actualDeliveryDate)}</p>
                  </div>
                )}
              </div>
              
              {selectedDispatch.deliveryNote && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Note</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDispatch.deliveryNote}</p>
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
    </section>
  );
} 