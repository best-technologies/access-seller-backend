export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    image?: string;
    category?: string;
  };
} 