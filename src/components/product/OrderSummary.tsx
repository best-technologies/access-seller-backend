import React from "react";
import type { ProductUI } from '@/types/product';

interface OrderSummaryProps {
  product: ProductUI;
  quantity: number;
  setQuantity: (q: number) => void;
  sellingPrice: string | number;
  stock: number;
  toast: (msg: string) => void;
}

// Helper function to format amount with commas (e.g., 8000 -> 8,000)
function formatWithCommas(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString();
}

export default function OrderSummary({ product, quantity, setQuantity, sellingPrice, stock, toast }: OrderSummaryProps) {
  const price = sellingPrice ? Number((sellingPrice as string).replace(/,/g, '')) : 0;
  return (
    <div className="p-5 rounded-xl border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3 text-base">Order Summary</h4>
      <div className="space-y-2 text-base">
        <div className="flex justify-between items-center">
          <span className="truncate text-gray-900 font-semibold text-base">{product?.title || ''}</span>
          <span className="flex-shrink-0 text-gray-900 font-semibold">₦{formatWithCommas(price)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Quantity</span>
          <div className="flex items-center border-2 border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden w-fit">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-gray-50 text-gray-700 hover:bg-indigo-50 active:bg-indigo-100 border-r border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={stock}
              value={quantity}
              onChange={e => {
                let val = parseInt(e.target.value) || 1;
                if (val > stock) {
                  val = stock;
                  toast(`Cannot order more than available stock (${stock})`);
                }
                setQuantity(Math.max(1, Math.min(val, stock)));
              }}
              className="w-10 h-8 text-center text-base font-semibold border-0 bg-white text-gray-900 focus:ring-0 focus:outline-none appearance-none"
              style={{ MozAppearance: 'textfield' }}
              aria-label="Quantity"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(Math.min(quantity + 1, stock))}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-gray-50 text-gray-700 hover:bg-indigo-50 active:bg-indigo-100 border-l border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={quantity >= stock}
            >
              +
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-lg">
          <span className="text-gray-900">Total</span>
          <span className="text-indigo-700">₦{formatWithCommas(price * quantity)}</span>
        </div>
      </div>
    </div>
  );
} 