"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  CheckCircle, 
  X,
  Printer,
  User,
  FileText,
  Package,
  DollarSign,
  Truck
} from "lucide-react";
import { printJobs, dispatchRecords, PrintJob } from "@/data/admin/printing/mockData";

export default function PrintJobsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printerFilter, setPrinterFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Calculate comprehensive KPIs
  const totalPrintJobs = printJobs.length;
  const totalCopiesPrinted = printJobs.reduce((sum, job) => sum + job.quantity, 0);
  const totalRevenue = printJobs.reduce((sum, job) => {
    // Estimate revenue based on quantity and format
    let pricePerCopy = 0;
    switch (job.format) {
      case 'soft_cover': pricePerCopy = 500; break;
      case 'hard_cover': pricePerCopy = 1200; break;
      case 'braille': pricePerCopy = 2000; break;
      case 'large_print': pricePerCopy = 800; break;
      case 'digital': pricePerCopy = 200; break;
      default: pricePerCopy = 500;
    }
    return sum + (job.quantity * pricePerCopy);
  }, 0);
  const dispatchedJobs = dispatchRecords.length;

  // Filter jobs based on search and filters
  const filteredJobs = printJobs.filter(job => {
    const matchesSearch = job.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesPrinter = printerFilter === "all" || job.assignedPrinter === printerFilter;
    const matchesFormat = formatFilter === "all" || job.format === formatFilter;

    return matchesSearch && matchesStatus && matchesPrinter && matchesFormat;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "printing": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
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

  const handleViewDetails = (job: PrintJob) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  return (
    <section className="space-y-8">
      {/* Section Heading */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Print Jobs</h2>
        <p className="text-gray-500 mt-1 text-sm">View and manage all print jobs. Use the filters to narrow down results.</p>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Print Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{totalPrintJobs}</p>
              <p className="text-xs text-gray-500 mt-1">All time print jobs</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Printer className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Copies Printed</p>
              <p className="text-2xl font-bold text-green-600">{totalCopiesPrinted.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All time copies</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated from print jobs</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dispatched Jobs</p>
              <p className="text-2xl font-bold text-orange-600">{dispatchedJobs}</p>
              <p className="text-xs text-gray-500 mt-1">Sent to destinations</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
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
            <option value="printing">Printing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={printerFilter}
            onChange={(e) => setPrinterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Printers</option>
            <option value="HP Indigo 7900">HP Indigo 7900</option>
            <option value="Canon imagePRESS C10000">Canon imagePRESS C10000</option>
            <option value="Braille Embosser Pro">Braille Embosser Pro</option>
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Formats</option>
            <option value="soft_cover">Soft Cover</option>
            <option value="hard_cover">Hard Cover</option>
            <option value="braille">Braille</option>
            <option value="large_print">Large Print</option>
            <option value="digital">Digital</option>
          </select>

          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Print Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Print Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Print ID</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Book Title</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Quantity</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Format</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Assigned Printer</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Requested By</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Requested Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{job.bookTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{job.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900"><span className="capitalize">{job.format.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900"><div className="flex items-center gap-2"><Printer className="h-4 w-4 text-gray-400" />{job.assignedPrinter}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{job.requestedBy}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatDate(job.requestedDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetails(job)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" title="View Details"><Eye className="h-4 w-4" /></button>
                      {job.status === "pending" && (
                        <>
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Reassign"><RefreshCw className="h-4 w-4" /></button>
                          <button className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" title="Complete"><CheckCircle className="h-4 w-4" /></button>
                          <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Cancel"><X className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Print Job Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Print ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.bookTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Format</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedJob.format.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Printer</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.assignedPrinter}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedJob.priority)}`}>
                    {selectedJob.priority.charAt(0).toUpperCase() + selectedJob.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.requestedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJob.requestedDate)}</p>
                </div>
                {selectedJob.startDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJob.startDate)}</p>
                  </div>
                )}
                {selectedJob.completedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJob.completedDate)}</p>
                  </div>
                )}
              </div>
              
              {selectedJob.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedJob.notes}</p>
                </div>
              )}
              
              {selectedJob.attachedFiles && selectedJob.attachedFiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attached Files</label>
                  <div className="mt-1 space-y-2">
                    {selectedJob.attachedFiles.map((file: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                        <FileText className="h-4 w-4" />
                        <span className="cursor-pointer underline">{file}</span>
                      </div>
                    ))}
                  </div>
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