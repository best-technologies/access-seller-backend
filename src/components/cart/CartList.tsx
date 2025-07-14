import CartItem from "./CartItem";
import CartEmptyState from "./CartEmptyState";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartListProps {
  items: CartItemType[];
  selected: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  search: string;
}

export default function CartList({ items, selected, onToggle, onRemove, onQuantityChange, search }: CartListProps) {
  if (items.length === 0) {
    return <CartEmptyState search={search} />;
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {items.map(item => (
        <CartItem
          key={item.productId}
          item={item}
          checked={selected.includes(item.productId)}
          onToggle={() => onToggle(item.productId)}
          onRemove={() => onRemove(item.productId)}
          onQuantityChange={qty => onQuantityChange(item.productId, qty)}
        />
      ))}
    </div>
  );
} 