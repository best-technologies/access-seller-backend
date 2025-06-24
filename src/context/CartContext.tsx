import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { CartItem } from "../types/cart";
import toast from "react-hot-toast";

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const lastToastRef = useRef<string>('');

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = (message: string) => {
    // Prevent duplicate toasts by checking if the same message was just shown
    if (lastToastRef.current === message) {
      return;
    }
    lastToastRef.current = message;
    toast.success(message);
    
    // Clear the ref after a short delay to allow the same message again if needed
    setTimeout(() => {
      lastToastRef.current = '';
    }, 100);
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.productId === item.productId);
      if (existing) {
        showToast(`${item.product?.name || 'Item'} quantity updated in cart!`);
        return prev.map(ci =>
          ci.productId === item.productId
            ? { ...ci, quantity: ci.quantity + item.quantity }
            : ci
        );
      }
      showToast(`${item.product?.name || 'Item'} added to cart!`);
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(ci => ci.productId === productId);
      if (itemToRemove) {
        showToast(`${itemToRemove.product?.name || 'Item'} removed from cart!`);
      }
      return prev.filter(ci => ci.productId !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      const updatedCart = prev.map(ci =>
        ci.productId === productId ? { ...ci, quantity } : ci
      );
      const updatedItem = updatedCart.find(ci => ci.productId === productId);
      if (updatedItem) {
        showToast(`${updatedItem.product?.name || 'Item'} quantity updated to ${quantity}!`);
      }
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    showToast("Cart cleared!");
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within a CartProvider");
  return ctx;
};
