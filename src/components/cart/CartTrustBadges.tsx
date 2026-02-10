import { Package, Truck, Shield } from "lucide-react";

export default function CartTrustBadges() {
  return (
    <div className="max-w-4xl mx-auto mt-2 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Free shipping</div>
            <div>On orders over $50</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Fast delivery</div>
            <div>2-3 business days</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Secure & Safe</div>
            <div>100% secure payment</div>
          </div>
        </div>
      </div>
    </div>
  );
} 