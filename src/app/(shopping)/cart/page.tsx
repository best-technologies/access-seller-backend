"use client";

import { useState, useEffect } from "react";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  Shield,
  Heart,
  Star,
  Info,
  CheckCircle
} from "lucide-react";
import Image from "next/image";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";
import { api } from "@/services/api";

// Add interface for cart item
interface CartItem {
  id: number;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  image: string;
  quantity: number;
  isbn: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  format: string;
}

// Enhanced mock data with more professional details
const cartItems: CartItem[] = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 24.99,
    originalPrice: 29.99,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop&crop=center",
    quantity: 1,
    isbn: "978-0-7432-7356-5",
    rating: 4.2,
    reviews: 1247,
    inStock: true,
    format: "Hardcover"
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 18.99,
    originalPrice: 22.99,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop&crop=center",
    quantity: 2,
    isbn: "978-0-06-112008-4",
    rating: 4.5,
    reviews: 2156,
    inStock: true,
    format: "Paperback"
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    price: 16.99,
    originalPrice: 19.99,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop&crop=center",
    quantity: 1,
    isbn: "978-0-452-28423-4",
    rating: 4.8,
    reviews: 3421,
    inStock: true,
    format: "Paperback"
  }
];

export default function ProfessionalCartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]); // You can enhance this later
  const [selected, setSelected] = useState<string[]>(cart.map(item => item.productId));
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  // Update selected when cart changes
  useEffect(() => {
    setSelected(cart.map(item => item.productId));
  }, [cart]);

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
  const subtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const savings = 0; // You can enhance this if you store originalPrice
  const shipping = subtotal > 50 ? 0 : 7.99;
  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - promoDiscount) * 0.08;
  const total = subtotal + shipping + tax - promoDiscount;

  // Mock: allowed part payment percentage from user profile
  const allowedPartPayment = 50; // Replace with real value from user profile
  const [paymentPercent, setPaymentPercent] = useState(100);
  const payNow = (total * paymentPercent) / 100;
  const payLater = total - payNow;

  // Handle checkout
  const handleCheckout = async () => {
    setIsLoading(true);
    setCheckoutMessage(null);
    try {
      // Prepare order data
      const orderData = {
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        paymentPercent,
        payNow,
        payLater,
        total,
      };
      console.log("Checkout order data:", orderData);
      // Call the API (mock endpoint, replace with real one)
      // const response = await api.orders.createOrder(orderData);
      // For now, just mock a response
      const response = { success: true, message: "Order placed successfully!" };
      console.log("Checkout API response:", response);
      setCheckoutMessage(response.message);
    } catch (error: any) {
      console.error("Checkout error:", error);
      setCheckoutMessage(error.message || "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <PageHeader title="Shopping Cart" />
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {cart.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    Your cart is empty
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Discover our curated collection of books and add your favorites to get started.
                  </p>
                  <a href="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                    Explore Books
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
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
                      />
                      <button
                        onClick={() => {
                          if (promoCode.toLowerCase() === 'save10') {
                            setPromoApplied(true);
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
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
                        <span>Promo discount (10%)</span>
                        <span>-₦{promoDiscount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>₦{tax.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                  </div>

                  {/* Payment Percentage Section */}
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

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">₦{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                  </div>

                  <button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-colors mt-6"
                    disabled={selectedItems.length === 0 || paymentPercent < allowedPartPayment || paymentPercent > 100 || isLoading}
                    onClick={handleCheckout}
                  >
                    {isLoading ? "Processing..." : `Proceed to Checkout (${selectedItems.length} selected)`}
                  </button>
                  {checkoutMessage && (
                    <div className="mt-4 text-center text-sm text-green-600">{checkoutMessage}</div>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Free shipping</div>
                        <div>On orders over $50</div>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}