import { apiFetch } from "./auth.api";

export interface DashboardResponse {
  success: boolean;
  data: {
    // Add your dashboard data structure here
    [key: string]: any;
  };
  message?: string;
}

export const userApi = {
  getUserDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiFetch('/user/fetch-user-dashboard');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch user dashboard');
    }
    
    return data;
  },

  wallet: {
    getWallet: async () => {
      const response = await apiFetch('/wallet');
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch wallet data');
      }
  
      return data.data;
    },
  },
  
  transactions: {
    getTransactionHistory: async () => {
      const response = await apiFetch('/transactions');
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch transaction history');
      }
  
      return data.data;
    },
  },
  
  updateUserProfile: async (userData: any) => {
    const response = await apiFetch('/user/update', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update user profile');
    }
    
    return data.data;
  },
};