export interface CartItem {
  productId: string;
  quantity: number;
  price: number; // for backward compatibility
  sellingPrice: number;
  normalPrice?: number;
  product?: {
    name: string;
    image?: string;
    category?: string;
  };
} 