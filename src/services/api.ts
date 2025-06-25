// api.ts - Pure API communication layer
import { DashboardResponse } from '@/types/admin/dashboard/dashboard';
import type { ProductsResponse } from '@/types/admin/products/products';
import type { CustomersResponse } from '@/types/admin/customers/customers';
import axios, { AxiosError, AxiosInstance } from 'axios';
import type { BrowseProductsResponse } from '@/types/product';
import { toast } from 'react-hot-toast';
import { PromoCodeVerifyResponse } from '@/types/admin/discounts/discount';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  firstName: string;
  lastName: string;
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
    affiliate: any; // Replace 'any' with a more specific type if available
    stats: {
      totalPurchases: number;
      totalEarned: number;
      totalWithdrawn: number;
      pendingWithdrawals: number;
    };
    tableAnalysis: any[]; // Replace 'any' with a more specific type if available
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

// Pure API methods - NO token storage or state management
export const api = { 
  auth: {
    login: (email: string, password: string): Promise<LoginResponse> =>
      axiosInstance.post('/auth/sign-in', { email, password }),

    register: (data: RegistrationData): Promise<RegisterResponse> =>
      axiosInstance.post('/auth/signup', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        gender: data.gender,
        country: data.country,
        referral_code: data.referralCode,
        updates_opt_in: data.updatesOptIn,
        agreeToTerms: data.agreeToTerms,
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
    requestAffiliateAccess: async (niche: string, reason: string): Promise<AffiliateAccessResponse> => {
      const res = await axiosInstance.post('/user/request-affiliate-access', { niche, reason });
      console.log("[API Call] response: ", res.data)
      return res as unknown as AffiliateAccessResponse;
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
    getSingleProduct: async (id: string): Promise<any> => {
      // Fetch a single product by id
      const response = await axiosInstance.get(`/products/${id}`);
      return response;
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
      console.log("Meta data: ", response)
      return response as unknown as MetadataResponse;
    }
  },

  discount: {
    verifyPromoCode: async (promoCode: string, productId: string): Promise<PromoCodeVerifyResponse> => {
      const response = await axiosInstance.post('/discount/verify-promocode', { code: promoCode, productId });
      console.log("[API call] Response: ", response);
      return response as unknown as PromoCodeVerifyResponse;
    },
  }
}