"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";
import GeneralNavbar from "@/components/GeneralNavbar";
import { api, CartOrderData } from '@/services/api';
import toast from 'react-hot-toast';
import CartHeader from "@/components/cart/CartHeader";
import CartTrustBadges from "@/components/cart/CartTrustBadges";
import CartList from "@/components/cart/CartList";
import CartOrderSummary from "@/components/cart/CartOrderSummary";
import CartConfirmationModal from "@/components/cart/CartConfirmationModal";
import ManualPaymentModal from "@/components/cart/ManualPaymentModal";
import CartShippingModal from '@/components/cart/CartShippingModal';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from "@/components/ui/loader";
import { useRouter } from 'next/navigation';

function PaymentStatusModal({ open, message }: { open: boolean; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4 min-w-[260px]">
        <Loader size="md" variant="primary" />
        <p className="text-base font-medium text-gray-800 text-center">{message}</p>
      </div>
    </div>
  );
}

export default function ProfessionalCartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied] = useState(false);
  const [selected, setSelected] = useState<string[]>(cart.map(item => item.productId));
  const [isLoading, setIsLoading] = useState(false);
  const [search] = useState("");
  const [allowedPartPayment, setAllowedPartPayment] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [referralDiscountPercent] = useState<number>(0);
  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [confirmClear, setConfirmClear] = useState(false);
  const [paymentPercent, setPaymentPercent] = useState(100);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOrderCompleteModal, setShowOrderCompleteModal] = useState(false);

  // Add shipping modal state and form
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    houseAddress: '',
    address: ''
  });

  const { user: typedUser } = useAuth();

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
  const promoDiscount = referralApplied ? subtotal * (referralDiscountPercent / 100) : 0;
  // const tax = (subtotal - promoDiscount) * 0.08;
  const total = Number(subtotal - promoDiscount + shipping /* + tax */);

  // Mock: allowed part payment percentage from user profile
  // const [paymentPercent, setPaymentPercent] = useState(100);

  // Update handleCheckout to accept shipping info
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Prepare order data
      const orderData: CartOrderData = {
        items: selectedItems.map((item: typeof cart[0]) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: Number(item.price) * Number(item.quantity),
          category: item.product?.category
        })),
        totalItems: selectedItems.length,
        referralCode: referralCode.trim() !== "" ? referralCode : null,
        referralDiscountPercent: referralApplied ? referralDiscountPercent : 0,
        referralDiscountAmount: promoDiscount,
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
        },
        // Shipping info
        shippingInfo: getShippingInfo(),
        // Callback URL for Paystack redirect
        callbackUrl: typeof window !== 'undefined' ? window.location.href : ''
      };
      
      // Call the real backend endpoint for cart checkout
      const response = await api.paystack.cartCheckoutInitialisePayment(orderData);
      const responseData = response.data;
      // Try to find the authorization_url in the response
      let authorizationUrl = null;
      if (responseData?.data?.paystackResponse?.authorization_url) {
        authorizationUrl = responseData.data.paystackResponse.authorization_url;
      } else if (responseData?.authorization_url) {
        authorizationUrl = responseData.authorization_url;
      } else if (responseData?.data?.authorization_url) {
        authorizationUrl = responseData.data.authorization_url;
      } else if (responseData?.paystackResponse?.authorization_url) {
        authorizationUrl = responseData.paystackResponse.authorization_url;
      }
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
        return;
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  // On redirect back from Paystack, verify payment
  useEffect(() => {
    const currentSelected = selected;
    const currentRemoveFromCart = removeFromCart;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || urlParams.get('trxref');
      if (reference) {
        setIsLoading(true);
        api.paystack.verifyCheckoutPayment(reference)
          .then((res) => {
            const responseData = res as unknown as { success: boolean; message?: string };
            if (responseData.success) {
              // Remove paid items from cart
              currentSelected.forEach(pid => currentRemoveFromCart(pid));
              toast.success('Payment verified! Order placed successfully.');
              setShowOrderCompleteModal(true);
              // Remove query params from URL after verification
              const url = new URL(window.location.href);
              url.searchParams.delete('reference');
              url.searchParams.delete('trxref');
              window.history.replaceState({}, document.title, url.pathname);
            } else {
              toast.error(responseData.message || 'Payment verification failed');
            }
          })
          .catch((err: { message?: string }) => {
            toast.error(err?.message || 'Payment verification failed');
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [removeFromCart, selected]);

  // Debug: log when onCheckout is called
  const handleShowShippingModal = () => {
    // console.log('Checkout button clicked!');
    setShowShippingModal(true);
  };

  const filteredCart = cart.filter(item => {
    const name = item.product?.name?.toLowerCase() || "";
    const id = item.productId.toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

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

  function getShippingInfo() {
    return {
      firstName: isAuthenticated && typedUser?.first_name ? typedUser.first_name : shippingForm.firstName,
      lastName: isAuthenticated && typedUser?.last_name ? typedUser.last_name : shippingForm.lastName,
      email: isAuthenticated && typedUser?.email ? typedUser.email : shippingForm.email,
      phone: (isAuthenticated && (typedUser as { phone?: string })?.phone ? (typedUser as { phone?: string }).phone : shippingForm.phone) || '',
      state: shippingForm.state,
      city: shippingForm.city,
      houseAddress: shippingForm.houseAddress,
      address: shippingForm.address,
    };
  }

  if (isLoading) return <PaymentStatusModal open={true} message={typeof window !== 'undefined' && (window.location.search.includes('reference') || window.location.search.includes('trxref')) ? 'Payment being verified...' : 'Opening secure payment gateway...'} />;

  function OrderCompleteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 min-w-[320px] max-w-[90vw]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Completed!</h2>
          <p className="text-gray-700 mb-4 text-center">Thank you for your purchase. Your order has been placed successfully.</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              onClick={() => { onClose(); router.push('/orders'); }}
            >
              View My Orders
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              onClick={() => { onClose(); router.push('/'); }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeneralNavbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <PageHeader title="Shopping Cart" />
        <CartTrustBadges />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CartHeader
            allSelected={allSelected}
            cartLength={cart.length}
            selectedLength={selected.length}
            onSelectAll={toggleSelectAll}
            onDeleteSelected={deleteSelected}
            onClearCart={() => setConfirmClear(true)}
            disableDelete={selected.length === 0}
            disableClear={cart.length === 0}
          />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CartList
                items={filteredCart}
                selected={selected}
                onToggle={toggleSelect}
                onRemove={pid => setConfirmDelete({ open: true, productId: pid })}
                onQuantityChange={updateQuantity}
                search={search}
              />
            </div>
            <div className="lg:col-span-1">
              <CartOrderSummary
                promoCode={referralCode}
                promoApplied={referralApplied}
                isLoading={isLoading}
                onPromoCodeChange={setReferralCode}
                discountPercent={referralDiscountPercent}
                selectedItems={selectedItems}
                subtotal={subtotal}
                savings={savings}
                shipping={shipping}
                promoDiscount={promoDiscount}
                isAuthenticated={isAuthenticated}
                allowedPartPayment={allowedPartPayment}
                paymentPercent={paymentPercent}
                setPaymentPercent={setPaymentPercent}
                payNow={payNow}
                payLater={payLater}
                total={total}
                onCheckout={handleShowShippingModal}
                manualBtn={() => setShowManualModal(true)}
              />
            </div>
          </div>
        </div>
        <CartShippingModal
          show={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          isProcessingPayment={isLoading}
          shippingForm={shippingForm}
          setShippingForm={setShippingForm}
          isAuthenticated={isAuthenticated}
          typedUser={typedUser ? {
            first_name: (typedUser as unknown as { first_name?: string }).first_name || '',
            last_name: (typedUser as unknown as { last_name?: string }).last_name || '',
            email: (typedUser as unknown as { email?: string }).email || '',
            phone: (typedUser as unknown as { phone?: string }).phone || '',
          } : null}
          cartItems={selectedItems.map(item => ({
            productId: item.productId,
            name: item.product?.name || '',
            quantity: item.quantity,
            price: item.price,
            sellingPrice: item.sellingPrice,
            product: item.product ? { name: item.product.name, stock: 100 } : undefined,
          }))}
          onSubmit={() => {
            setShowShippingModal(false);
            handleCheckout();
          }}
          onQuantityChange={updateQuantity}
          allowedPartPayment={allowedPartPayment}
          paymentPercent={paymentPercent}
          payNow={payNow}
          payLater={payLater}
        />
        {/* Confirmation Modal for Delete */}
        <CartConfirmationModal
          open={confirmDelete.open}
          title="Remove Item?"
          message="Are you sure you want to remove this item from your cart?"
          onCancel={() => setConfirmDelete({ open: false, productId: null })}
          onConfirm={() => {
            if (confirmDelete.productId) removeFromCart(confirmDelete.productId);
            setConfirmDelete({ open: false, productId: null });
          }}
        />
        {/* Confirmation Modal for Clear Cart */}
        <CartConfirmationModal
          open={confirmClear}
          title="Clear Cart?"
          message="Are you sure you want to remove all items from your cart?"
          confirmLabel="Clear All"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearCart();
            setConfirmClear(false);
          }}
        />
        <ManualPaymentModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} payNow={payNow} />
        <OrderCompleteModal open={showOrderCompleteModal} onClose={() => setShowOrderCompleteModal(false)} />
      </div>
    </>
  );
}