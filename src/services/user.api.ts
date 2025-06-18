import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor for auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DashboardResponse {
  success: boolean;
  data: {
    // Add your dashboard data structure here
    [key: string]: unknown;
  };
  message?: string;
}

export interface UserProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  country?: string;
  profile_picture?: string;
  [key: string]: unknown;
}

export const userApi = {
  getUserDashboard: async (): Promise<DashboardResponse> => {
    const response = await axiosInstance.get('/user/fetch-user-dashboard');
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch user dashboard');
    }
    
    return data;
  },

  wallet: {
    getWallet: async () => {
      const response = await axiosInstance.get('/wallet');
      const data = response.data;
  
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch wallet data');
      }
  
      return data.data;
    },
  },
  
  transactions: {
    getTransactionHistory: async () => {
      const response = await axiosInstance.get('/transactions');
      const data = response.data;
  
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch transaction history');
      }
  
      return data.data;
    },
  },
  
  updateUserProfile: async (userData: UserProfileData) => {
    const response = await axiosInstance.post('/user/update', userData);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update user profile');
    }
    
    return data.data;
  },
};