// Product interface placeholder
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  commissionRate: number;
  referralCommission: number;
  allowedMarketers?: string[]; // IDs of marketers allowed to promote this product
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
