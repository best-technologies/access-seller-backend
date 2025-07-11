"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  Shield,
  Info,
  CheckCircle,
  Banknote,
  X,
  ChevronDown,
  UploadCloud
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
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMethod, setManualMethod] = useState<string>("");
  const [showManualUploadBox, setShowManualUploadBox] = useState(false);
  const manualModalRef = useRef<HTMLDivElement>(null);
  const [manualUploads, setManualUploads] = useState<File[]>([]);
  const [manualUploadError, setManualUploadError] = useState<string | null>(null);
  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [confirmClear, setConfirmClear] = useState(false);

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
  const subtotal = selectedItems.reduce((total, item) => {
    const price = Number(item.sellingPrice ?? item.price ?? 0);
    const qty = Number(item.quantity ?? 1);
    return total + (isNaN(price) || isNaN(qty) ? 0 : price * qty);
  }, 0);
  const savings = 0; // You can enhance this if you store originalPrice
  const shipping = subtotal > 5000000 ? 0 : 7.99;
  const promoDiscount = promoApplied ? subtotal * (promoDiscountPercent / 100) : 0;
  // const tax = (subtotal - promoDiscount) * 0.08;
  const total = Number(subtotal - promoDiscount + shipping /* + tax */);

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
        // tax,
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
  const fullTotal = Number(subtotal - promoDiscount + shipping /* + tax */);
  // Calculate how much the user pays now, based on the slider
  const payNow = (fullTotal * Number(paymentPercent)) / 100;
  const payLater = fullTotal - payNow;

  // // Helper to get a valid price for a cart item
  // // function getCartItemPrice(item: any) {
  // //   // Prefer sellingPrice if it's a valid number, else fallback to price
  // //   const selling = typeof item.sellingPrice === 'number' ? item.sellingPrice : Number(item.sellingPrice);
  // //   if (!isNaN(selling)) return selling;
  // //   const price = typeof item.price === 'number' ? item.price : Number(item.price);
  // //   if (!isNaN(price)) return price;
  // //   return 0;
  // // }
  // function getCartItemQty(item: any) {
  //   const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
  //   return !isNaN(qty) && qty > 0 ? qty : 1;
  // }

  function handleManualUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setManualUploadError(null);
    // If user reselects method, reset upload box
    if (!showManualUploadBox) setShowManualUploadBox(true);
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = [...manualUploads];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setManualUploadError('Only JPG, JPEG, and PNG files are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setManualUploadError('Each file must be less than 10MB.');
        continue;
      }
      if (newFiles.length >= 3) {
        setManualUploadError('You can upload a maximum of 3 images.');
        break;
      }
      // Prevent duplicate files by name/size
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }
    setManualUploads(newFiles.slice(0, 3));
  }

  function removeManualUpload(idx: number) {
    setManualUploads(prev => prev.filter((_, i) => i !== idx));
  }

  // Reset upload box when method changes
  useEffect(() => {
    setShowManualUploadBox(false);
    setManualUploads([]);
    setManualUploadError(null);
  }, [manualMethod]);

  // Helper to reset manual payment modal state
  function resetManualModal() {
    setManualMethod("");
    setShowManualUploadBox(false);
    setManualUploads([]);
    setManualUploadError(null);
  }

  // When closing the manual modal, reset all related state
  function handleCloseManualModal() {
    setShowManualModal(false);
    resetManualModal();
  }

  // When submitting receipt, also reset state (simulate submission)
  function handleSubmitReceipt() {
    setShowManualModal(false);
    resetManualModal();
    // You can add a toast or confirmation here if needed
  }

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
              <button onClick={() => setConfirmClear(true)} disabled={cart.length === 0} className="text-red-600 hover:underline disabled:text-gray-400">Clear Cart</button>
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
                                onClick={() => setConfirmDelete({ open: true, productId: item.productId })}
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
                      <label className="text-sm font-medium text-gray-700">Referral Code</label>
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

                    {/* Itemized Summary */}
                    {/* {selectedItems.length > 0 && (
                      <div className="mb-4">
                        <div className="font-semibold text-gray-800 mb-2 text-sm">Items in your order:</div>
                        <div className="space-y-3">
                          {selectedItems.map((item: any, idx: number) => {
                            const price = getCartItemPrice(item);
                            const qty = getCartItemQty(item);
                            const total = price * qty;
                            return (
                              <div
                                key={item.productId}
                                className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm px-3 py-2 flex flex-col gap-1"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-indigo-700 text-base">{idx + 1}.</span>
                                  <span className="font-semibold text-gray-900 text-sm truncate" title={item.product?.name || item.productId}>
                                    {item.product?.name || item.productId}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-4 items-center text-xs text-gray-700 pl-6">
                                  <span className="inline-block bg-white border border-gray-200 rounded px-2 py-0.5">Unit: <span className="font-medium">₦{price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                                  <span className="inline-block bg-white border border-gray-200 rounded px-2 py-0.5">Qty: <span className="font-medium">{qty}</span></span>
                                  <span className="inline-block bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 font-semibold text-indigo-700">Total: ₦{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <hr className="my-3 border-gray-200" />
                      </div>
                    )} */}
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
                      
                      {/* <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span>₦{tax.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div> */}
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
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors"
                        disabled={
                          selectedItems.length === 0 ||
                          paymentPercent < (allowedPartPayment ?? 100) ||
                          paymentPercent > 100 ||
                          isLoading
                        }
                        onClick={handleCheckout}
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
                        onClick={() => { resetManualModal(); setShowManualModal(true); }}
                        disabled={selectedItems.length === 0}
                        type="button"
                      >
                        Pay Manually
                      </button>
                    </div>

                    {/* Manual Payment Modal */}
                    {showManualModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div ref={manualModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 relative p-0">
                          {/* Modal Header */}
                          <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-7 w-7 text-indigo-600" />
                              <span className="text-lg font-bold text-gray-900">Manual Payment</span>
                            </div>
                            <button
                              className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
                              onClick={handleCloseManualModal}
                              aria-label="Close"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                          <div className="px-6 pb-6 pt-2">
                            <p className="text-gray-700 mb-5 text-sm text-left">Select your preferred manual payment method below. You will receive instructions after selection.</p>
                            {/* Custom Dropdown */}
                            <div className="mb-6 relative">
                              <label htmlFor="manual-method" className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                              <div className="relative">
                                <select
                                  id="manual-method"
                                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 pr-10 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                                  value={manualMethod}
                                  onChange={e => setManualMethod(e.target.value)}
                                >
                                  <option value="">Select a method</option>
                                  <option value="bank_deposit">Bank Deposit — Pay cash at any branch</option>
                                  <option value="bank_transfer">Bank Transfer — Send from your mobile app</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                            {/* Instructions Section */}
                            {manualMethod && (
                              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-left animate-fade-in">
                                <div className="font-semibold text-indigo-800 mb-1">Instructions:</div>
                                <div className="mb-3 flex items-center gap-2">
                                  <span className="text-gray-700 text-sm">Amount to pay:</span>
                                  <span className="text-2xl font-bold text-indigo-700">₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                </div>
                                {manualMethod === 'bank_deposit' && (
                                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                    <li>Visit any branch of our partner bank.</li>
                                    <li>Deposit the total amount into the account below.</li>
                                    <li>Keep your deposit slip as proof of payment.</li>
                                  </ul>
                                )}
                                {manualMethod === 'bank_transfer' && (
                                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                    <li>Open your mobile banking app or internet banking.</li>
                                    <li>Transfer the total amount to the account below.</li>
                                    <li>Use your order ID as the transfer reference if possible.</li>
                                  </ul>
                                )}
                                {/* Example account details (replace with real data) */}
                                <div className="mt-3 bg-white border border-indigo-100 rounded p-3 text-xs text-gray-700">
                                  <div><span className="font-semibold">Bank:</span> Access Bank</div>
                                  <div><span className="font-semibold">Account Name:</span> Accessible Books Ltd</div>
                                  <div><span className="font-semibold">Account Number:</span> 1234567890</div>
                                </div>
                                {/* I have made the transfer button */}
                                {!showManualUploadBox && (
                                  <button
                                    className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-base transition-colors shadow"
                                    onClick={() => setShowManualUploadBox(true)}
                                  >
                                    I have made the transfer
                                  </button>
                                )}
                                {/* Strict notification and upload box only after clicking above */}
                                {showManualUploadBox && (
                                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center border border-gray-100">
                                      <button
                                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
                                        onClick={() => setShowManualUploadBox(false)}
                                        aria-label="Back"
                                      >
                                        <X className="h-6 w-6" />
                                      </button>
                                      <UploadCloud className="h-14 w-14 text-indigo-500 mb-3" />
                                      <div className="mb-2 text-lg font-bold text-gray-900">Upload Payment Receipt</div>
                                      <div className="mb-4 text-sm text-gray-600 text-center max-w-xs">
                                        <span className="block mb-2 text-base text-indigo-700 font-semibold">Amount: ₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                        Please upload a clear photo or screenshot of your payment receipt. This is required for us to confirm your order. You can upload up to 3 images (JPG/PNG, max 10MB each).
                                      </div>
                                      <div className="w-full flex flex-col items-center gap-2">
                                        <label htmlFor="manual-upload-input" className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition rounded-xl py-8 px-4 mb-2">
                                          <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                                          <span className="text-sm text-indigo-700 font-medium">Drag & drop or click to select files</span>
                                          <span className="text-xs text-gray-500">(JPG, JPEG, PNG, max 10MB each, up to 3 images)</span>
                                          <input
                                            id="manual-upload-input"
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg"
                                            multiple
                                            onChange={handleManualUpload}
                                            className="hidden"
                                            disabled={manualUploads.length >= 3}
                                          />
                                        </label>
                                        {manualUploadError && <div className="text-xs text-red-600 mb-1">{manualUploadError}</div>}
                                        <div className="flex flex-wrap gap-3 mt-2 w-full justify-center">
                                          {manualUploads.map((file, idx) => (
                                            <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-indigo-200 bg-white flex items-center justify-center shadow-sm">
                                              <Image
                                                src={URL.createObjectURL(file)}
                                                alt={`Upload ${idx + 1}`}
                                                width={96}
                                                height={96}
                                              />
                                              <button
                                                type="button"
                                                className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-500 hover:text-red-600 shadow"
                                                onClick={() => removeManualUpload(idx)}
                                                title="Remove"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="mt-6 w-full">
                                        <button
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-base transition-colors shadow"
                                          onClick={handleSubmitReceipt}
                                          disabled={manualUploads.length === 0}
                                        >
                                          Submit Receipt
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {!showManualUploadBox && (
                              <button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-base transition-colors mt-2 shadow"
                                onClick={handleCloseManualModal}
                                disabled={!manualMethod}
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {checkoutMessage && (
                      <div className="mt-4 text-center text-sm text-green-600">{checkoutMessage}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal for Delete */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove Item?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to remove this item from your cart?</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setConfirmDelete({ open: false, productId: null })}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.productId) removeFromCart(confirmDelete.productId);
                  setConfirmDelete({ open: false, productId: null });
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Clear Cart */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Clear Cart?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to remove all items from your cart?</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setConfirmClear(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}