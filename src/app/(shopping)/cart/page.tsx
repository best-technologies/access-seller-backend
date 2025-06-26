"use client";

import { useState, useEffect } from "react";
import { 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  Shield,
  Info,
  CheckCircle
} from "lucide-react";
import Image from "next/image";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import GeneralNavbar from "@/components/GeneralNavbar";
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function ProfessionalCartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [selected, setSelected] = useState<string[]>(cart.map(item => item.productId));
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [allowedPartPayment, setAllowedPartPayment] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);

  // Update selected when cart changes
  useEffect(() => {
    setSelected(cart.map(item => item.productId));
  }, [cart]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    setIsAuthenticated(!!token);
    if (token) {
      api.user.getCheckoutProfile()
        .then(res => {
          const value = res.data?.allowedPartialPayment ?? 0;
          setAllowedPartPayment(value);
          if (value > 0) {
            toast.success(`🎉 You can pay as low as ${value}% of your order now!`);
          } else {
            toast.error("😞 You do not qualify for partial payment at this time.");
          }
        })
        .catch(() => setAllowedPartPayment(100));
    }
  }, []);

  const allSelected = selected.length === cart.length && cart.length > 0;
  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : cart.map(item => item.productId));
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };
  const deleteSelected = () => {
    selected.forEach(pid => removeFromCart(pid));
  };

  // Only selected items for checkout
  const selectedItems = cart.filter(item => selected.includes(item.productId));
  const subtotal = selectedItems.reduce(
    (total, item) => total + (Number(item.sellingPrice) * Number(item.quantity)),
    0
  );
  const savings = 0; // You can enhance this if you store originalPrice
  const shipping = subtotal > 5000000 ? 0 : 7.99;
  const promoDiscount = promoApplied ? subtotal * (promoDiscountPercent / 100) : 0;
  const tax = (subtotal - promoDiscount) * 0.08;
  const total = Number(subtotal - promoDiscount + shipping + tax);

  // Mock: allowed part payment percentage from user profile
  const [paymentPercent, setPaymentPercent] = useState(100);

  // Handle checkout
  const handleCheckout = async () => {
    setIsLoading(true);
    setCheckoutMessage(null);
    try {
      // Prepare order data
      const orderData = {
        items: selectedItems.map((item: typeof cart[0]) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: Number(item.price) * Number(item.quantity),
          category: item.product?.category
        })),
        totalItems: selectedItems.length,
        promoCode: promoApplied ? promoCode : null,
        promoDiscountPercent: promoApplied ? promoDiscountPercent : 0,
        promoDiscountAmount: promoDiscount,
        subtotal,
        shipping,
        tax,
        total,
        // Partial payment details (if applicable)
        partialPayment: isAuthenticated && allowedPartPayment && allowedPartPayment > 0 ? {
          allowedPercentage: allowedPartPayment,
          selectedPercentage: paymentPercent,
          payNow,
          payLater,
          toBalance: payLater
        } : null,
        // Full payment details
        fullPayment: {
          total,
          payNow: isAuthenticated && allowedPartPayment && allowedPartPayment > 0 ? payNow : total,
          payLater: isAuthenticated && allowedPartPayment && allowedPartPayment > 0 ? payLater : 0
        }
      };
      
      console.log("=== CHECKOUT DATA TO BE SENT TO BACKEND ===");
      console.log("Order Data:", JSON.stringify(orderData, null, 2));
      console.log("=== END CHECKOUT DATA ===");
      
      // Call the API (mock endpoint, replace with real one)
      // const response = await api.orders.createOrder(orderData);
      // For now, just mock a response
      const response = { success: true, message: "Order placed successfully!" };
      console.log("Checkout API response:", response);
      setCheckoutMessage(response.message);
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      setCheckoutMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCart = cart.filter(item => {
    const name = item.product?.name?.toLowerCase() || "";
    const id = item.productId.toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  // Verify promo code 
  const handleVerifyPromoCode = async () => {
    setIsLoading(true);
    try {
      // Get a productId from the selected items (use the first one for now)
      const productId = selectedItems[0]?.productId;
      if (!productId) {
        toast.error("No product selected for promo code application.");
        setIsLoading(false);
        return;
      }
      const res = await api.discount.verifyPromoCode(promoCode, productId);
      const result = res.data as { discountPercent?: string | number };
      const discountPercent = result.discountPercent ? Number(result.discountPercent) : 0;
      if (discountPercent) {
        setPromoApplied(true);
        setPromoDiscountPercent(discountPercent);
        toast.success(`🎉 Promo code applied! You get ${discountPercent}% off.`);
      } else {
        setPromoApplied(false);
        setPromoDiscountPercent(0);
        toast.error("Promo code is invalid.");
      }
    } catch (error: unknown) {
      setPromoApplied(false);
      setPromoDiscountPercent(0);
      toast.error(error instanceof Error ? error.message : "Failed to verify promo code.");
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate the full total (for display)
  const fullTotal = Number(subtotal - promoDiscount + shipping + tax);
  // Calculate how much the user pays now, based on the slider
  const payNow = (fullTotal * Number(paymentPercent)) / 100;
  const payLater = fullTotal - payNow;

  return (
    <>
      <GeneralNavbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <PageHeader title="Shopping Cart" />
        {/* Trust Badges - moved to top */}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Cart Summary */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              <span className="text-gray-600">
                Select All ({cart.length})
              </span>
              <button onClick={deleteSelected} disabled={selected.length === 0} className="text-red-600 hover:underline disabled:text-gray-400">Delete Selected</button>
              <button onClick={clearCart} disabled={cart.length === 0} className="text-red-600 hover:underline disabled:text-gray-400">Clear Cart</button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items - Takes up 2 columns */}
            <div className="lg:col-span-2">
              {/* Cart Search Input */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search cart items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredCart.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="h-12 w-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      {search ? "No items match your search" : "Your cart is empty"}
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Discover our curated collection of books and add your favorites to get started.
                    </p>
                    <Link href="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">Explore Books</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredCart.map((item) => (
                      <div key={item.productId} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
                        <input type="checkbox" checked={selected.includes(item.productId)} onChange={() => toggleSelect(item.productId)} />
                        <div className="flex gap-6 flex-1">
                          {/* Book Image */}
                          <div className="relative">
                            <div className="w-28 h-36 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                              {item.product?.image && (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  width={112}
                                  height={144}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </div>
                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                  {item.product?.name || item.productId}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>{item.product?.category}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Remove"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                  className="p-2 hover:bg-gray-50 rounded-l-lg"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 text-center border-0 focus:ring-0"
                                />
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-50 rounded-r-lg"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <span className="text-sm text-gray-500">
                                Price: ₦{item.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary - Takes up 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Promo Code */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Promo Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={promoApplied}
                        />
                        <button
                          onClick={handleVerifyPromoCode}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                          disabled={promoCode.trim() === "" || promoApplied || isLoading}
                        >
                          Apply
                        </button>
                      </div>
                      {promoApplied && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Promo code applied!</span>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
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
                        <div className="flex items-center gap-2">
                          <span>Shipping</span>
                          <Info className="h-4 w-4" />
                        </div>
                        <span>{shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}</span>
                      </div>
                      
                      {promoApplied && (
                        <div className="flex justify-between text-green-600">
                          <span>Promo discount ({promoDiscountPercent}%)</span>
                          <span>-₦{promoDiscount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span>₦{tax.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                    </div>

                    {/* Payment Percentage Section */}
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
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors mt-6"
                      disabled={
                        selectedItems.length === 0 ||
                        paymentPercent < (allowedPartPayment ?? 100) ||
                        paymentPercent > 100 ||
                        isLoading
                      }
                      onClick={handleCheckout}
                    >
                      {isLoading ? "Processing..." : `Checkout #${allowedPartPayment} (${selectedItems.length} selected)`}
                    </button>
                    {checkoutMessage && (
                      <div className="mt-4 text-center text-sm text-green-600">{checkoutMessage}</div>
                    )}

                    {/* Trust Badges */}
                    {/* <div className="mt-2 pt-6 border-t border-gray-100 space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Free shipping</div>
                          <div>Enjoy free delivery anywhere</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Fast delivery</div>
                          <div>2-3 business days</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Secure & Safe</div>
                          <div>100% secure payment</div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}