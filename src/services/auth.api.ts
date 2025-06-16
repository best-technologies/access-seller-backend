import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000/api/v1';

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

// Create a custom fetch function with authentication
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<Response> {
  try {
    // Prepare headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    // Add any custom headers from options
    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value: string, key: string) => {
        headers.set(key, value);
      });
    }

    // Only add authorization header if endpoint requires auth
    if (requiresAuth) {
      const token = Cookies.get('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    // Create a custom timeout solution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Configure fetch options
    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
    };
    
    try {
      // Make the request
      const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Handle token expiration (401 Unauthorized)
      if (requiresAuth && response.status === 401) {
        Cookies.remove('access_token');
        window.location.href = '/auth/login';
        throw new Error('Authentication expired. Please log in again.');
      }
      
      // If response is not ok, throw an error with the response text
      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
      
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          const text = await response.text();
          errorMessage = text;
        }
      
        throw new Error(errorMessage);
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('API Request Failed:', error);
    
    if (error instanceof TypeError) {
      if (error.message === 'Network request failed') {
        throw new Error('Network request failed. Please check your internet connection and try again.');
      }
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
}

// API methods
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false),

    register: (data: RegistrationData) =>
      apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
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
      }, false),

    verifyOTP: (otp: string, email: string) =>
      apiFetch('/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ otp, email }),
      }, false),

    logout: () =>
      apiFetch('/auth/logout', {
        method: 'POST',
      }),

    refreshToken: () =>
      apiFetch('/auth/refresh', {
        method: 'POST',
      }),
      
    sendOtpToEmail: (email: string) =>
      apiFetch('/auth/request-password-reset-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false),

    updatePassword: (email: string, otp: string, newPassword: string) =>
      apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      }, false),
  },
  
  // User endpoints
  user: {
    getProfile: () => 
      apiFetch('/user/fetch-user-profile'),
  }
}
