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

export default function CartItem({ item, checked, onToggle, onRemove, onQuantityChange }: CartItemProps) {
  return (
    <div className="p-6 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
      <input type="checkbox" checked={checked} onChange={onToggle} />
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
              onClick={onRemove}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              title="Remove"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
                className="p-2 hover:bg-gray-50 rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={e => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-0 focus:ring-0"
              />
              <button
                onClick={() => onQuantityChange(item.quantity + 1)}
                className="p-2 hover:bg-gray-50 rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Price: ₦{!isNaN(Number(item.price)) ? Number(item.price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 