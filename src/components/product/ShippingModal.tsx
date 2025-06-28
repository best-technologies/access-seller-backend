import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderSummary from "./OrderSummary";
import NigeriaStateSelector from "@/components/ui/NigeriaStateSelector";

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  houseAddress: string;
  address: string;
}

import type { User as UserBase } from '@/services/api';

type User = UserBase & { phone?: string };

interface ProductUI {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  amountSaved?: number;
  stock: number;
  images: string[];
  category: string;
  categoryId?: string;
  commission?: number;
  isActive?: boolean;
  status?: string;
  isbn?: string;
  publisher?: string;
  format?: string[];
  availableFormats?: string[];
  language?: string[];
  genre?: string[];
  createdAt?: string;
  updatedAt?: string;
  features?: string[];
  rating?: number;
  reviews?: number;
  specifications?: Record<string, string>;
  isNew?: boolean;
  author?: string;
  discount?: number;
}

interface ShippingModalProps {
  show: boolean;
  onClose: () => void;
  isProcessingPayment: boolean;
  handleShippingSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  shippingForm: ShippingForm;
  setShippingForm: (cb: (prev: ShippingForm) => ShippingForm) => void;
  isAuthenticated: boolean;
  typedUser: User | null;
  product: ProductUI | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  toast: (msg: string) => void;
  stock: number;
}

export default function ShippingModal({
  show,
  onClose,
  isProcessingPayment,
  handleShippingSubmit,
  shippingForm,
  setShippingForm,
  isAuthenticated,
  typedUser,
  product,
  quantity,
  setQuantity,
  toast,
  stock
}: ShippingModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/10 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-full sm:max-w-md mx-auto max-h-[90vh] min-h-[400px] min-w-[320px] sm:min-w-[400px] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl sm:rounded-t-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Shipping Information</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {isProcessingPayment ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Processing Payment...</p>
              <p className="text-base text-gray-600">Please wait while we secure your order</p>
            </div>
          ) : (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={isAuthenticated && typedUser?.first_name ? typedUser.first_name : shippingForm.firstName}
                    onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50 ${(isAuthenticated && typedUser?.first_name) ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                    placeholder="Enter your first name"
                    required
                    readOnly={isAuthenticated && !!typedUser?.first_name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={isAuthenticated && typedUser?.last_name ? typedUser.last_name : shippingForm.lastName}
                    onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50 ${(isAuthenticated && typedUser?.last_name) ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                    placeholder="Enter your last name"
                    required
                    readOnly={isAuthenticated && !!typedUser?.last_name}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={isAuthenticated && typedUser?.email ? typedUser.email : shippingForm.email}
                  onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, email: e.target.value }))}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50 ${(isAuthenticated && typedUser?.email) ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                  placeholder="Enter your email address"
                  required
                  readOnly={isAuthenticated && !!typedUser?.email}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={isAuthenticated && typedUser?.phone ? typedUser.phone : shippingForm.phone}
                  onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, phone: e.target.value }))}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50 ${(isAuthenticated && typedUser?.phone) ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                  placeholder="Enter your phone number"
                  required
                  readOnly={isAuthenticated && !!typedUser?.phone}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NigeriaStateSelector
                  selectedState={shippingForm.state}
                  onStateChange={state => setShippingForm((prev: ShippingForm) => ({ ...prev, state, city: '' }))}
                  selectedLGA={shippingForm.city}
                  onLGAChange={city => setShippingForm((prev: ShippingForm) => ({ ...prev, city }))}
                  className="col-span-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">House Address *</label>
                <input
                  type="text"
                  value={shippingForm.houseAddress}
                  onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, houseAddress: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50"
                  placeholder="Enter your house address (e.g. 12B, Johnson St)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Shipping Address *</label>
                <textarea
                  value={shippingForm.address}
                  onChange={e => setShippingForm((prev: ShippingForm) => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50"
                  rows={3}
                  placeholder="Enter your complete shipping address"
                  required
                />
              </div>
              {product && (
                <OrderSummary
                  product={product}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  sellingPrice={product.price}
                  stock={stock}
                  toast={toast}
                />
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold shadow-sm"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !shippingForm.firstName ||
                    !shippingForm.lastName ||
                    !shippingForm.email ||
                    !shippingForm.phone ||
                    !shippingForm.state ||
                    !shippingForm.city ||
                    !shippingForm.houseAddress ||
                    !shippingForm.address
                  }
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  Proceed to Payment
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 