import CartPromoCode from "./CartPromoCode";

interface CartOrderSummaryProps {
  promoCode: string;
  promoApplied: boolean;
  isLoading: boolean;
  onPromoCodeChange: (v: string) => void;
  onApplyPromo: () => void;
  discountPercent: number;
  selectedItems: any[];
  subtotal: number;
  savings: number;
  shipping: number;
  promoDiscount: number;
  isAuthenticated: boolean;
  allowedPartPayment: number | null;
  paymentPercent: number;
  setPaymentPercent: (v: number) => void;
  payNow: number;
  payLater: number;
  total: number;
  onCheckout: () => void;
  manualBtn: () => void;
}

export default function CartOrderSummary({
  promoCode,
  promoApplied,
  isLoading,
  onPromoCodeChange,
  onApplyPromo,
  discountPercent,
  selectedItems,
  subtotal,
  savings,
  shipping,
  promoDiscount,
  isAuthenticated,
  allowedPartPayment,
  paymentPercent,
  setPaymentPercent,
  payNow,
  payLater,
  total,
  onCheckout,
  manualBtn,
}: CartOrderSummaryProps) {
  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="referral-code" className="text-sm font-medium text-gray-700">Referral Code</label>
            <input
              id="referral-code"
              type="text"
              value={promoCode}
              onChange={e => onPromoCodeChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50"
              placeholder="Enter referral code (optional)"
              autoComplete="off"
            />
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({selectedItems.length} items)</span>
              <span>₦{subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Savings</span>
                <span>-₦{savings.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}</span>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-green-600">
                <span>Promo discount ({discountPercent}%)</span>
                <span>-₦{promoDiscount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
            )}
          </div>
          {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Choose Payment Percentage</h3>
              <div className="flex items-center gap-4 mb-2">
                <input
                  type="range"
                  min={allowedPartPayment}
                  max={100}
                  value={paymentPercent}
                  onChange={e => setPaymentPercent(Number(e.target.value))}
                  className="w-40 accent-indigo-600"
                />
                <input
                  type="number"
                  min={allowedPartPayment}
                  max={100}
                  value={paymentPercent}
                  onChange={e => setPaymentPercent(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center"
                />
                <span className="text-gray-700 font-medium">% of total</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                You can pay between <span className="font-semibold">{allowedPartPayment}%</span> and <span className="font-semibold">100%</span> of your order now. The balance can be paid later.
              </p>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span>Pay now ({paymentPercent}%):</span>
                  <span className="font-semibold text-indigo-600">₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance to pay later:</span>
                  <span className="font-semibold text-gray-700">₦{payLater.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
              </div>
              {(paymentPercent < allowedPartPayment || paymentPercent > 100) && (
                <div className="text-red-600 text-xs mt-2">Please enter a value between {allowedPartPayment}% and 100%.</div>
              )}
            </div>
          )}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center gap-2">
              {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && paymentPercent < 100 ? (
                <>
                  <span className="text-lg font-semibold text-gray-900">Pay Now</span>
                  <span className="text-2xl font-bold text-indigo-700">₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </>
              )}
            </div>
            {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && paymentPercent < 100 && (
              <div className="flex justify-between items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Balance after payment:</span>
                <span className="text-sm font-semibold text-gray-700">₦{payLater.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors"
              disabled={
                selectedItems.length === 0 ||
                paymentPercent < (allowedPartPayment ?? 100) ||
                paymentPercent > 100 ||
                isLoading
              }
              onClick={onCheckout}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <span className="flex flex-col items-center leading-tight">
                  <span>Checkout</span>
                  <span className="text-xs font-normal text-gray-200 mt-0.5">
                    {isAuthenticated && allowedPartPayment && allowedPartPayment > 0 && paymentPercent < 100
                      ? `${selectedItems.length} items • Pay ₦${payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} now`
                      : `${selectedItems.length} items • ₦${total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`
                    }
                  </span>
                </span>
              )}
            </button>
            <button
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 py-4 rounded-xl font-semibold text-lg transition-colors"
              onClick={manualBtn}
            >
              Manual Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 