import { Search, Tag, ChevronDown } from "lucide-react";
import React from "react";

interface CategoryOption {
  value: string;
  label: string;
}

interface BookCatalogSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  filteredCategories: CategoryOption[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  statusValue?: string;
  setStatusValue?: (val: string) => void;
  showSeeAllButton?: boolean;
  seeAllHref?: string;
  headerTitle?: string;
  headerDescription?: string;
}

const BookCatalogSearchFilter: React.FC<BookCatalogSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  categorySearch,
  setCategorySearch,
  filteredCategories,
  selectedCategory,
  setSelectedCategory,
  statusValue = "",
  setStatusValue,
  showSeeAllButton = false,
  seeAllHref = "/admin/products/all",
  headerTitle = "Book Catalog",
  headerDescription = "Search and filter your book collection",
}) => {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-6 mb-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Search className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{headerTitle}</h2>
              <p className="text-xs text-gray-500">{headerDescription}</p>
            </div>
          </div>
          {showSeeAllButton && (
            <a
              href={seeAllHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              See All
            </a>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <span className="absolute left-3 top-2 z-20 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by book name, ISBN, or publisher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <span className="absolute left-3 top-2 z-20 pointer-events-none">
              <Tag className="h-4 w-4 text-gray-400" />
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              />
              <div className="relative">
                <select
                  className="w-full pl-10 pr-8 py-2.5 border border-t-0 border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-2 z-20 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <span className="absolute left-3 top-2 z-20 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div className="relative">
              <select
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                value={statusValue}
                onChange={e => setStatusValue && setStatusValue(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
              </select>
              <span className="absolute right-3 top-2 z-20 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCatalogSearchFilter; 