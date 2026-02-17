import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CartEmptyStateProps {
  search: string;
}

export default function CartEmptyState({ search }: CartEmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        {search ? "No items match your search" : "Your cart is empty"}
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Discover our curated collection of books and add your favorites to get started.
      </p>
      <Link href="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">Explore Books</Link>
    </div>
  );
} 