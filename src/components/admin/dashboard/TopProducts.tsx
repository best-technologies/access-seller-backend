import { Star, TrendingUp, BookOpen } from "lucide-react";
import { topProducts } from "@/data/admin/dashboard/mockData";

export default function TopProducts() {
  const formatCurrency = (amount: number) => {
    return `₦${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Books</h3>
            <p className="text-sm text-gray-500">Best performing books by sales</p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View All Books
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {topProducts.map((product, index) => (
          <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  #{index + 1}
                </div>
              </div>

              {/* Book Image Placeholder */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-gray-500" />
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{product.rating}</span>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="text-sm font-medium text-gray-900">{product.sales}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className={`text-sm font-medium ${
                      product.stock < 30 ? 'text-red-600' : 
                      product.stock < 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {product.stock}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 