// authContext.tsx - Pure state management and UI logic
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, tokenManager } from '@/services/api';
import type { User, LoginResponse, RegisterResponse, ProfileResponse } from '@/services/api';

interface RegistrationData {
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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// List of protected routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/orders',
  '/settings',
  '/admin',
  '/dashboard'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle auth state changes and redirects
  const handleAuthStateChange = useCallback((authenticated: boolean, userData: User | null = null) => {
    setIsAuthenticated(authenticated);
    setUser(userData);
    
    if (!authenticated) {
      tokenManager.remove();
    }
  }, []);

  // Handle API errors (including 401 unauthorized)
  const handleApiError = useCallback((error: Error) => {
    if (error.message === 'UNAUTHORIZED') {
      handleAuthStateChange(false);
      router.replace('/auth/login');
    }
  }, [handleAuthStateChange, router]);

  // Check for existing token and validate it
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Checking authentication...');
      const token = tokenManager.get();
      console.log('Token found:', !!token);
      
      if (!token) {
        console.log('No token found, setting auth state to false');
        handleAuthStateChange(false);
        return false;
      }

      console.log('Token found, validating with server...');
      // Validate token by fetching user profile
      const profile = await api.user.getProfile();
      console.log('Profile validation result:', profile);
      console.log('Profile success:', profile.success);
      console.log('Profile data:', profile.data);
      
      if (profile.success && profile.data) {
        console.log('Profile validation successful, setting auth state to true');
        handleAuthStateChange(true, profile.data);
        return true;
      } else {
        console.log('Profile validation failed, setting auth state to false');
        console.log('Success check:', profile.success);
        console.log('Data check:', !!profile.data);
        handleAuthStateChange(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      handleApiError(error as Error);
      return false;
    }
  }, [handleAuthStateChange, handleApiError]);

  // Refresh auth state (useful for token refresh scenarios)
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      await checkAuth();
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  // Initial auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname?.startsWith('/auth');
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));

    // Redirect unauthenticated users from protected routes
    if (!isAuthenticated && isProtectedRoute) {
      router.replace('/auth/login');
    } 
    // Redirect authenticated users away from auth pages
    else if (isAuthenticated && isAuthPage) {
      router.replace('/');
    }
  }, [isAuthenticated, pathname, isLoading, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      // Store token
      tokenManager.set(response.data.access_token);

      // Fetch user details after successful login
      const userProfile = await api.user.getProfile();

      console.log("User profile: ", userProfile)
      
      if (!userProfile.success) {
        throw new Error(userProfile.message || 'Failed to fetch user details');
      }

      // Update auth state with user details
      handleAuthStateChange(true, userProfile.data);
      router.replace('/');
    } catch (error) {
      console.error('Login error:', error);
      handleApiError(error as Error);
      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const response = await api.auth.register(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      router.replace(`/auth/otp-verification?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      handleAuthStateChange(false);
      router.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isLoading,
      login, 
      register, 
      logout, 
      checkAuth,
      refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}