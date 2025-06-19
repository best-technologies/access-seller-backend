import { useState, useRef } from 'react';
import { X, Upload, FileText, BookOpen, Download, AlertCircle } from 'lucide-react';

interface AddBookOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualEntry: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export default function AddBookOptionsModal({
  isOpen,
  onClose,
  onManualEntry,
  onFileUpload,
  isLoading
}: AddBookOptionsModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls') || 
           file.name.endsWith('.csv');
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `Book Name,Description,Quantity,Selling Price,Normal Price,Category,Language,Format,Genre,Age Rating,ISBN,Publisher
"The Great Gatsby","A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.","50","2500","3000","Fiction & Literature","English","Paperback","Classic","Adult (18+)","978-0743273565","Scribner"
"Atomic Habits","An easy and proven way to build good habits and break bad ones.","75","3500","4000","Self-Help & Personal Development","English","Paperback","Self-Help","Adult (18+)","978-0735211292","Avery"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Add New Books</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose how you'd like to add books to your catalog
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Entry Option */}
            <div 
              onClick={onManualEntry}
              className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add books one by one with detailed information
                </p>
                <div className="text-xs text-gray-400">
                  Best for: Adding individual books with full details
                </div>
              </div>
            </div>

            {/* File Upload Option */}
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 group">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload Excel or CSV file with multiple books
                </p>
                <div className="text-xs text-gray-400">
                  Best for: Adding many books at once
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-green-400 bg-green-50' 
                  : selectedFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer" 
                          onClick={() => fileInputRef.current?.click()}>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    Excel (.xlsx, .xls) or CSV files up to 10MB
                  </p>
                </div>
              ) : (
                <div>
                  <FileText className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Remove
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isLoading ? 'Uploading...' : 'Upload & Process'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">File Requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Supported formats: Excel (.xlsx, .xls) or CSV</li>
                    <li>• Maximum file size: 10MB</li>
                    <li>• Required columns: Book Name, Quantity, Selling Price, Category</li>
                    <li>• Download the template for the correct format</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 