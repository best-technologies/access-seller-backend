// api.ts - Pure API communication layer
import axios, { AxiosError, AxiosInstance } from 'axios';

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
    }
  }
}