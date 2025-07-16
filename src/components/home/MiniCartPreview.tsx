"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function MiniCartPreview() {
  const router = useRouter();
  const { cart } = useCart();

  return (
    <div className="relative group">
      <button 
        onClick={() => router.push("/cart")}
        className="flex items-center gap-2 px-4 py-2 rounded hover:bg-indigo-50"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6 text-indigo-600" />
          <span className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            {cart.length}
          </span>
        </div>
      </button>
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg p-4 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
        <div className="font-semibold mb-2">Cart Preview</div>
        {cart.length === 0 ? (
          <div className="text-gray-500 text-sm">Your cart is empty.</div>
        ) : (
          <ul className="divide-y divide-gray-200 mb-2">
            {cart.map((item) => (
              <li key={item.productId} className="py-2 flex justify-between items-center">
                <span className="truncate">{item.product?.name || item.productId}</span>
                <span className="text-gray-600 text-sm">x{item.quantity}</span>
                <span className="font-medium">₦{item.price}</span>
              </li>
            ))}
          </ul>
        )}
        <button 
          onClick={() => router.push("/cart")}
          className="w-full bg-indigo-600 text-white py-2 rounded mt-2 hover:bg-indigo-700 transition"
        >
          Go to Cart
        </button>
      </div>
    </div>
  );
}
