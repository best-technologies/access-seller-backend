import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  checked: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
}

export default function CartItem({ 
  item, 
  checked, 
  onToggle, 
  onRemove, 
  onQuantityChange 
}: CartItemProps) {
  return (
    <div className="p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0">
      {/* Mobile Layout (< 640px) */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={onToggle} 
            className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2" 
          />
          
          {/* Book Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
              {item.product?.image && (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  width={64}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
              {item.product?.name || item.productId}
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              {item.product?.category}
            </p>
            
            {/* Price */}
            <div className="text-base font-bold text-gray-900 mb-3">
              ₦{
                !isNaN(Number(String(item.price).replace(/,/g, "")))
                  ? Number(String(item.price).replace(/,/g, "")).toLocaleString()
                  : '0'
              }
            </div>

            {/* Quantity and Remove - Mobile Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
                  className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border-0 focus:ring-0 text-sm font-medium"
                />
                <button
                  onClick={() => onQuantityChange(item.quantity + 1)}
                  className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={onRemove}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove item"
                aria-label="Remove item from cart"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet and Desktop Layout (>= 640px) */}
      <div className="hidden sm:flex items-center gap-4 lg:gap-6">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onToggle} 
          className="flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2" 
        />
        
        {/* Book Image */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-24 lg:w-24 lg:h-30 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
            {item.product?.image && (
              <Image
                src={item.product.image}
                alt={item.product.name}
                width={96}
                height={120}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base lg:text-lg leading-tight mb-1 line-clamp-2">
            {item.product?.name || item.productId}
          </h3>
          <p className="text-sm text-gray-500">
            {item.product?.category}
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center border border-gray-300 rounded-lg flex-shrink-0">
          <button
            onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
            className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={e => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 text-center border-0 focus:ring-0 text-sm font-medium"
          />
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price */}
        <div className="text-base lg:text-lg font-bold text-gray-900 flex-shrink-0 min-w-[80px] text-right">
          ₦{
            !isNaN(Number(String(item.price).replace(/,/g, "")))
              ? Number(String(item.price).replace(/,/g, "")).toLocaleString()
              : '0'
          }
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
          title="Remove item"
          aria-label="Remove item from cart"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}