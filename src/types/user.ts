// User & marketer/admin types placeholder
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'marketer' | 'buyer';
  profileImage?: string;
  contactInfo?: {
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Marketer extends User {
  role: 'marketer';
  referralCode: string;
  allowedProducts: string[]; // IDs of products they can promote
  commissions: {
    pending: number;
    paid: number;
    total: number;
  };
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}
