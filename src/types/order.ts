// Order/commission models placeholder
export interface Order {
  id: string;
  userId: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
  };
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Commission {
  id: string;
  orderId: string;
  marketerId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productIsbn: string;
  productPublisher: string;
  displayImage: string;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface UserOrder {
  id: string;
  orderId: string;
  status: string;
  total: number;
  shippingAddress: string;
  state: string;
  city: string;
  houseAddress: string;
  orderPaymentStatus: string;
  trackingNumber: string;
  withdrawalStatus: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    pagination: Pagination;
    orders: UserOrder[];
  };
}
