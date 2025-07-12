import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NigeriaStateSelector from "@/components/ui/NigeriaStateSelector";
import QuantitySelector from "@/components/product/QuantitySelector";

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

interface CartShippingModalProps {
  show: boolean;
  onClose: () => void;
  isProcessingPayment: boolean;
  shippingForm: ShippingForm;
  setShippingForm: (cb: (prev: ShippingForm) => ShippingForm) => void;
  isAuthenticated: boolean;
  typedUser: any;
  cartItems: any[];
  onSubmit: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  allowedPartPayment?: number | null;
  paymentPercent?: number;
  payNow?: number;
  payLater?: number;
}

export default function CartShippingModal({
  show,
  onClose,
  isProcessingPayment,
  shippingForm,
  setShippingForm,
  isAuthenticated,
  typedUser,
  cartItems,
  onSubmit,
  onQuantityChange,
  allowedPartPayment = null,
  paymentPercent = 100,
  payNow = 0,
  payLater = 0
}: CartShippingModalProps) {
  if (!show) return null;
  // Calculate overall total
  const overallTotal = cartItems.reduce((sum, item) => {
    const price = Number(item.sellingPrice ?? item.price ?? 0);
    const qty = Number(item.quantity ?? 1);
    return sum + (isNaN(price) || isNaN(qty) ? 0 : price * qty);
  }, 0);
  // Helper to get value from typedUser or shippingForm
  const getField = (field: keyof ShippingForm) =>
    (isAuthenticated && typedUser?.[field.replace(/([A-Z])/g, '_$1').toLowerCase()]) || shippingForm[field];
  const allFieldsFilled = [
    getField('firstName'),
    getField('lastName'),
    getField('email'),
    getField('phone'),
    getField('state'),
    getField('city'),
    getField('houseAddress'),
    getField('address'),
  ].every(Boolean);
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
            <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-6">
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
              {/* Cart summary */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Cart Summary</h4>
                <ul className="divide-y divide-gray-100">
                  {cartItems.map((item, idx) => (
                    <li key={item.productId || idx} className="py-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-800">{item.product?.name || item.name}</span>
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                        <span className="text-sm font-medium text-gray-900">₦{(item.sellingPrice ?? item.price ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <QuantitySelector
                          quantity={item.quantity}
                          setQuantity={(q) => onQuantityChange(item.productId, q)}
                          stock={item.product?.stock ?? 100}
                          toast={(msg) => {}}
                        />
                        <span className="text-xs text-gray-700 ml-2">Total: ₦{((item.sellingPrice ?? item.price ?? 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-1 mt-4 border-t pt-2">
                  {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && paymentPercent < 100 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Pay Now ({paymentPercent}%):</span>
                        <span className="font-bold text-indigo-700 text-lg">₦{payNow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Balance to pay later:</span>
                        <span className="font-semibold text-gray-700">₦{payLater.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Full Total:</span>
                        <span className="text-xs text-gray-500">₦{overallTotal.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-indigo-700 text-lg">₦{overallTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
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
                  disabled={!allFieldsFilled}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  Proceed to Payment
                  {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && paymentPercent < 100
                    ? ` (₦${payNow.toLocaleString()} now)`
                    : ''}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 