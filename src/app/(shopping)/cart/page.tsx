"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";
import GeneralNavbar from "@/components/GeneralNavbar";
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import CartHeader from "@/components/cart/CartHeader";
import CartTrustBadges from "@/components/cart/CartTrustBadges";
import CartList from "@/components/cart/CartList";
import CartOrderSummary from "@/components/cart/CartOrderSummary";
import CartConfirmationModal from "@/components/cart/CartConfirmationModal";
import ManualPaymentModal from "@/components/cart/ManualPaymentModal";
import CartShippingModal from '@/components/cart/CartShippingModal';
import { useAuth } from '@/hooks/useAuth';

export default function ProfessionalCartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [selected, setSelected] = useState<string[]>(cart.map(item => item.productId));
  const [isLoading, setIsLoading] = useState(false);
  const [search] = useState("");
  const [allowedPartPayment, setAllowedPartPayment] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number>(0);
  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [confirmClear, setConfirmClear] = useState(false);
  const [paymentPercent, setPaymentPercent] = useState(100);
  const [showManualModal, setShowManualModal] = useState(false);

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
  const handleCheckout = async (shippingInfo?: typeof shippingForm) => {
    setIsLoading(true);
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
        shippingInfo: getShippingInfo()
      };
      
      console.log("=== CHECKOUT DATA TO BE SENT TO BACKEND ===");
      console.log("Order Data:", JSON.stringify(orderData, null, 2));
      console.log("=== END CHECKOUT DATA ===");
      
      // Call the API (mock endpoint, replace with real one)
      // const response = await api.orders.createOrder(orderData);
      // For now, just mock a response
      const response = { success: true, message: "Order placed successfully!" };
      console.log("Checkout API response:", response);
      toast.success(response.message);
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Verify promo code 
  const handleVerifyReferralCode = async () => {
    setIsLoading(true);
    try {
      // Get a productId from the selected items (use the first one for now)
      const productId = selectedItems[0]?.productId;
      if (!productId) {
        toast.error("No product selected for promo code application.");
        setIsLoading(false);
        return;
      }
      const res = await api.discount.verifyPromoCode(referralCode, productId);
      const result = res.data as { discountPercent?: string | number };
      const discountPercent = result.discountPercent ? Number(result.discountPercent) : 0;
      if (discountPercent) {
        setReferralApplied(true);
        setReferralDiscountPercent(discountPercent);
        toast.success(`🎉 Referral code applied! You get ${discountPercent}% off.`);
      } else {
        setReferralApplied(false);
        setReferralDiscountPercent(0);
        toast.error("Referral code is invalid.");
      }
    } catch (error: unknown) {
      setReferralApplied(false);
      setReferralDiscountPercent(0);
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

  function getShippingInfo() {
    return {
      firstName: isAuthenticated && typedUser?.first_name ? typedUser.first_name : shippingForm.firstName,
      lastName: isAuthenticated && typedUser?.last_name ? typedUser.last_name : shippingForm.lastName,
      email: isAuthenticated && typedUser?.email ? typedUser.email : shippingForm.email,
      phone: isAuthenticated && (typedUser as any)?.phone ? (typedUser as any).phone : shippingForm.phone,
      state: shippingForm.state,
      city: shippingForm.city,
      houseAddress: shippingForm.houseAddress,
      address: shippingForm.address,
    };
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
                onApplyPromo={handleVerifyReferralCode}
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
          typedUser={typedUser}
          cartItems={selectedItems}
          onSubmit={() => {
            setShowShippingModal(false);
            handleCheckout(shippingForm);
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
      </div>
    </>
  );
}