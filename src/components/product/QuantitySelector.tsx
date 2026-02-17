import React from "react";

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (q: number) => void;
  stock: number;
  toast: (msg: string) => void;
}

export default function QuantitySelector({ quantity, setQuantity, stock, toast }: QuantitySelectorProps) {
  return (
    <div className="flex items-center border-2 border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden w-fit">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        className="w-10 h-10 flex items-center justify-center text-xl font-bold bg-gray-50 text-gray-700 hover:bg-indigo-50 active:bg-indigo-100 border-r border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        disabled={quantity <= 1}
      >
        -
      </button>
      <input
        type="number"
        min="1"
        max={stock}
        value={quantity}
        onChange={(e) => {
          let val = parseInt(e.target.value) || 1;
          if (val > stock) {
            val = stock;
            toast(`Cannot order more than available stock (${stock})`);
          }
          setQuantity(Math.max(1, Math.min(val, stock)));
        }}
        className="w-14 h-10 text-center text-lg font-semibold border-0 bg-white text-gray-900 focus:ring-0 focus:outline-none appearance-none"
        style={{ MozAppearance: 'textfield' }}
        aria-label="Quantity"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQuantity(Math.min(quantity + 1, stock))}
        className="w-10 h-10 flex items-center justify-center text-xl font-bold bg-gray-50 text-gray-700 hover:bg-indigo-50 active:bg-indigo-100 border-l border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        disabled={quantity >= stock}
      >
        +
      </button>
    </div>
  );
} 