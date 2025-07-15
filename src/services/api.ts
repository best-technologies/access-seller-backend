// api.ts - Pure API communication layer
import { DashboardResponse } from '@/types/admin/dashboard/dashboard';
import type { ProductsResponse } from '@/types/admin/products/products';
import type { CustomersResponse } from '@/types/admin/customers/customers';
import axios, { AxiosError, AxiosInstance } from 'axios';
import type { BrowseProductsResponse, Product } from '@/types/product';
import { PromoCodeVerifyResponse } from '@/types/admin/discounts/discount';
import type { ApiResponse } from '@/types/order';

let API_URL: string = "";
if(process.env.NODE_ENV === "development") {
  API_URL = "http://localhost:2000/api/v1"
} else if (process.env.NODE_ENV === "production") {
  API_URL = process.env.NEXT_PUBLIC_API_URL || "";
}

// const API_URL = "http://localhost:2000/api/v1"

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor for auth token
axiosInstance.interceptors.request.use((config) => {
  const token = tokenManager.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(error.response?.data?.message || error.message);
  }
);

export interface RegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middleName?: string;
  phone?: string;
  gender?: string;
  country?: string;
  referralCode?: string;
  updatesOptIn?: boolean;
  agreeToTerms: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  role: string;
  is_affiliate?: boolean;
  affiliate_status?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token?: string; // optional, only for normal users
    role?: string;         // optional, for privileged users
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface AffiliateAccessResponse {
  success: boolean;
  message: string;
  data: {
    is_affiliate: boolean;
    affiliate_status: 'not_affiliate' | 'awaiting_approval' | 'rejected' | 'approved';
    createdAt: string | null;
    affiliate: Record<string, unknown>; // Use a more specific type if available
    stats: {
      totalPurchases: number;
      totalEarned: number;
      totalWithdrawn: number;
      pendingWithdrawals: number;
    };
    tableAnalysis: unknown[]; // Use a more specific type if available
  };
}

export interface MetadataResponse {
  success: boolean;
  message: string;
  data: {
    categories: { id: string; name: string }[];
    genres: { id: string; name: string }[];
    languages: { id: string; name: string }[];
    formats: { id: string; name: string }[];
    ageRatings: { name: string }[];
  };
}

export interface AddCategoryReponse {
  success: boolean;
  message: string;
  data: {
    id: string,
    name: string,
    description: string,
    storeId: string,
    isActive: true,
    createdAt: string,
    updatedAt: string,
    createdByName: string,
    createdByEmail: string
}
}

export interface AddGenreResponse {
  success: boolean;
  message: string;
  data: {
    id: string,
    name: string,
    description?: string,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
    createdByName?: string,
    createdByEmail?: string
  }
}

export interface AddLanguageResponse {
  success: boolean;
  message: string;
  data: {
    id: string,
    name: string,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
    createdByName?: string,
    createdByEmail?: string
  }
}

export interface AddFormatResponse {
  success: boolean;
  message: string;
  data: {
    id: string,
    name: string,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
    createdByName?: string,
    createdByEmail?: string
  }
}

export interface AddAgeRatingResponse {
  success: boolean;
  message: string;
  data: {
    id: string,
    name: string,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
    createdByName?: string,
    createdByEmail?: string
  }
}

// Response type for adding a new bank
export interface AddNewBankResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    userId: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Token management - to be used by auth context
export const tokenManager = {
  get: () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    console.log('TokenManager.get() called, token exists:', !!token);
    return token;
  },
  
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    console.log('TokenManager.set() called, storing token');
    localStorage.setItem('access_token', token);
  },
  
  remove: () => {
    if (typeof window === 'undefined') return;
    console.log('TokenManager.remove() called, removing token');
    localStorage.removeItem('access_token');
  }
};

// Type for cart order data
export interface CartOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    category?: string;
  }>;
  totalItems: number;
  referralCode?: string | null;
  referralDiscountPercent?: number;
  referralDiscountAmount?: number;
  subtotal: number;
  shipping: number;
  total: number;
  partialPayment?: {
    allowedPercentage: number;
    selectedPercentage: number;
    payNow: number;
    payLater: number;
    toBalance: number;
  } | null;
  fullPayment: {
    total: number;
    payNow: number;
    payLater: number;
  };
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
    city: string;
    houseAddress: string;
    address: string;
  };
  callbackUrl?: string;
}

// Pure API methods - NO token storage or state management
export const api = { 
  auth: {
    login: (email: string, password: string): Promise<LoginResponse> =>
      
      axiosInstance.post('/auth/sign-in', { email, password }),

    register: (data: RegistrationData): Promise<RegisterResponse> =>
      axiosInstance.post('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      }),

    verifyOTP: (otp: string, email: string) =>
      axiosInstance.post('/auth/admin-verify-login-otp', { otp, email }),

    logout: () =>
      axiosInstance.post('/auth/logout'),

    refreshToken: () =>
      axiosInstance.post('/auth/refresh'),
      
    sendOtpToEmail: (email: string) =>
      axiosInstance.post('/auth/request-password-reset-email', { email }),

    resendLoginOtp: (email: string) =>
      axiosInstance.post('/auth/resend-login-otp', { email }),

    updatePassword: (email: string, otp: string, newPassword: string) =>
      axiosInstance.post('/auth/reset-password', { 
        email, 
        otp, 
        new_password: newPassword 
      }),
  },
  
  // User endpoints
  user: {
    getProfile: async (): Promise<ProfileResponse> => {
      console.log('Fetching user profile...');
      const data = await axiosInstance.get('/auth/fetch-user-details');
      console.log('Profile fetch response:', data);
      return data as unknown as ProfileResponse;
    },
    getCheckoutProfile: async () => {
      const data = await axiosInstance.get('/user/user-checkout-profile');
      return data;
    },
    getAffiliateDashboard: async () => {
      const data = await axiosInstance.get('/user/affiliate-dashboard');
      return data;
    },
    getAffiliateLinks: async () => {
      const data = await axiosInstance.get('/user/affiliate-links');
      return data;
    },
    generateAffiliateLink: async (productId: string) => {
      const data = await axiosInstance.post('/user/generate-link', { productId });
      return data;
    },
    requestAffiliateAccess: async (niche: string, reason: string): Promise<AffiliateAccessResponse> => {
      const res = await axiosInstance.post('/user/request-affiliate-access', { niche, reason });
      console.log("[API Call] response: ", res.data)
      return res as unknown as AffiliateAccessResponse;
    },
    addBankAccount: async (data: { bankName: string; bankCode: string; accountNumber: string; accountName: string }): Promise<AddNewBankResponse> => {
      const res = await axiosInstance.post('/user/bank', data);
      console.log("[API] response: ", res)
      return res as unknown as AddNewBankResponse;
    },
    deleteBankAccount: async (bankId: string): Promise<{ success: boolean; message: string }> => {
      const res = await axiosInstance.delete('/user/bank', { data: { bankId } });
      return res as unknown as { success: boolean; message: string };
    },
    requestWithdrawal: async (data: { amount: number; bankCode: string }): Promise<{ success: boolean; message: string }> => {
      const res = await axiosInstance.post('/user/withdrawal-request', data);
      return res as unknown as { success: boolean; message: string };
    },
    getUserOrders: async (page = 1): Promise<ApiResponse> => {
      return axiosInstance.get(`/orders?page=${page}`);
    },
  },

  public: {
    getHomepageProducts: async ():Promise<DashboardResponse> => {
      console.log('[API] Fetching homepage products from /products');
      const response = await axiosInstance.get('/products');
      console.log('[API] Homepage products response:', response);
      return response as unknown as DashboardResponse;
    },
    getBrowseProducts: async (page = 1): Promise<BrowseProductsResponse> => {
      console.log(`[API] Fetching browse products from /products/browse?page=${page}`);
      const response = await axiosInstance.get(`/products/browse?page=${page}`);
      console.log('[API] Browse products response:', response);
      return response as unknown as BrowseProductsResponse;
    },
    getSingleProduct: async (id: string): Promise<Product> => {
      // Fetch a single product by id
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data as Product;
    },
  },

  admin: {
    dashboard: async (): Promise<DashboardResponse> => {
      console.log("Fetching admin dashboard");
      const response = await axiosInstance.get("admin/dashboard/stats")
      return response as unknown as DashboardResponse
    },
    products: {
      getAll: async (page = 1): Promise<ProductsResponse> => {
        console.log("Fetching admin products");
        const response = await axiosInstance.get(`admin/products/all?page=${page}`);
        console.log("get all products response: ", response)
        return response as unknown as ProductsResponse;
      },
      create: async (formData: FormData): Promise<unknown> => {
        console.log("Creating new product");
        const formDataInstance = axios.create({
          baseURL: API_URL,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        // Add auth token
        const token = tokenManager.get();
        if (token) {
          formDataInstance.defaults.headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await formDataInstance.post("admin/products/add-new", formData);
        return response.data;
      },
      uploadImage: async (formData: FormData): Promise<{ success: boolean; url?: string; message?: string }> => {
        // Upload a single image and return its URL
        const formDataInstance = axios.create({
          baseURL: API_URL,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
          }
        });
        const token = tokenManager.get();
        if (token) {
          formDataInstance.defaults.headers.Authorization = `Bearer ${token}`;
        }
        const response = await formDataInstance.post("admin/products/upload-image", formData);
        return response.data;
      },
      update: async (id: string, formData: FormData): Promise<unknown> => {
        const formDataInstance = axios.create({
          baseURL: API_URL,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
          }
        });
        const token = tokenManager.get();
        if (token) {
          formDataInstance.defaults.headers.Authorization = `Bearer ${token}`;
        }
        const response = await formDataInstance.patch(`admin/products/update/${id}`, formData);
        return response.data;
      }
    },
    customers: async (): Promise<CustomersResponse> => {
      console.log("Fetching admin customers");
      const response = await axiosInstance.get("admin/customers/dashboard");
      return response as unknown as CustomersResponse;
    },
    fetchMetadata: async (): Promise<MetadataResponse> => {
      const response = await axiosInstance.get('/admin/metadata/all');
      return response as unknown as MetadataResponse;
    },
    getAffiliateDashboard: async (): Promise<import('@/types/admin/dashboard/dashboard').AffiliateDashboardResponse> => {
      const response = await axiosInstance.get('/admin/affiliates');
      return response as unknown as import('@/types/admin/dashboard/dashboard').AffiliateDashboardResponse;
    },
    getAllAffiliates: async (page = 1, limit = 20, status?: string) => {
      let url = `/admin/affiliates/all?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      const response = await axiosInstance.get(url);
      return response;
    },
    getAffiliatePayouts: async (page = 1, limit = 20, status?: string) => {
      let url = `/admin/affiliates/payouts?page=${page}&limit=${limit}`;
      if (status && status !== 'all') url += `&status=${status}`;
      const response = await axiosInstance.get(url);
      return response;
    },
    updateAffiliateStatus: async (id: string, status: string) => {
      // Sends a PUT request to update affiliate status
      const response = await axiosInstance.put(`/admin/affiliates/${id}/status`, { status });
      return response;
    },
    addCategory: async (name: string, description: string): Promise<AddCategoryReponse> => {
      const response = await axiosInstance.post("/admin/category/add-new", { name, description });
      return response as unknown as AddCategoryReponse;
    },
    addGenre: async (name: string, description?: string): Promise<AddGenreResponse> => {
      const response = await axiosInstance.post("/admin/genres/add-new", { name, description });
      return response as unknown as AddGenreResponse;
    },
    addLanguage: async (name: string): Promise<AddLanguageResponse> => {
      const response = await axiosInstance.post("/admin/languages/add-new", { name });
      return response as unknown as AddLanguageResponse;
    },
    addFormat: async (name: string, description?: string): Promise<AddFormatResponse> => {
      const response = await axiosInstance.post("/admin/formats/add-new", { name, description });
      return response as unknown as AddFormatResponse;
    },
    addAgeRating: async (name: string): Promise<AddAgeRatingResponse> => {
      const response = await axiosInstance.post("/admin/age-ratings/add-new", { name });
      return response as unknown as AddAgeRatingResponse;
    },
    updateWithdrawalStatus: async (withdrawalId: string, status: string) => {
      // Calls /admin/affiliates/update-withdrawal-status with withdrawalId and status
      const response = await axiosInstance.post('/admin/affiliates/update-withdrawal-status', {
        withdrawalId,
        status,
      });
      return response;
    },
  },

  discount: {
    verifyPromoCode: async (promoCode: string, productId: string): Promise<PromoCodeVerifyResponse> => {
      const response = await axiosInstance.post('/discount/verify-promocode', { code: promoCode, productId });
      console.log("[API call] Response: ", response);
      return response as unknown as PromoCodeVerifyResponse;
    },
  },

  paystack: {
    affiliateInitialisePayment: async (data: {
      productId: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      state: string;
      city: string;
      houseAddress: string;
      fullShippingAddress: string;
      referralSlug: string;
      quantity: number;
      totalAmount: number;
      callbackUrl: string;
    }) => {
      // Sends backendData to /paystack/affiliate-initialise-paystack-payment
      return axiosInstance.post('/paystack/affiliate-initialise-paystack-payment', data);
    },
    cartCheckoutInitialisePayment: async (orderData: CartOrderData) => {
      // Sends orderData to /paystack/cart-checkout-initialise-paystack-payment
      return axiosInstance.post('/paystack/cart-checkout-initialise-paystack-payment', orderData);
    },
    verifyPaystackFunding: async (reference: string) => {
      console.log("calling endpoint: /paystack/verify-paystack-funding")
      return axiosInstance.post('/paystack/verify-paystack-funding', { reference });
    },
    verifyCheckoutPayment: async (reference: string) => {
      console.log("calling endpoint: /paystack/verify-cart-payment")
      return axiosInstance.post('/paystack/verify-cart-payment', { reference });
    },
    getOrderById: async (id: string) => {
      // Calls /paystack/order/:id to fetch order details
      return axiosInstance.get(`/paystack/order/${id}`);
    },
    getBanks: async () => {
      const response = await axiosInstance.get('/paystack/banks');
      return response;
    },
    verifyAccountNumber: async (account_number: string, bank_code: string) => {
      const response = await axiosInstance.post('/paystack/verify-account-number', { account_number, bank_code });
      return response as unknown;
    },
  },
}