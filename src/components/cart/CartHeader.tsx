// import { Trash2 } from "lucide-react";

interface CartHeaderProps {
  allSelected: boolean;
  cartLength: number;
  selectedLength: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onClearCart: () => void;
  disableDelete: boolean;
  disableClear: boolean;
}

export default function CartHeader({
  allSelected,
  cartLength,
  onSelectAll,
  onDeleteSelected,
  onClearCart,
  disableDelete,
  disableClear,
}: CartHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <input type="checkbox" checked={allSelected} onChange={onSelectAll} />
      <span className="text-gray-600">
        Select All ({cartLength})
      </span>
      <button onClick={onDeleteSelected} disabled={disableDelete} className="text-red-600 hover:underline disabled:text-gray-400">Delete Selected</button>
      <button onClick={onClearCart} disabled={disableClear} className="text-red-600 hover:underline disabled:text-gray-400">Clear Cart</button>
    </div>
  );
} 