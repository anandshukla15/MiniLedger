import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loan, LoanSummary, User } from '../types';

// Storage keys
const TOKEN_KEY = '@miniledger_token';
const USER_KEY = '@miniledger_user';
const API_URL_KEY = '@miniledger_api_base_url';

// Default host detection
const getDefaultBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // Android emulator alias for localhost
    return 'http://10.0.2.2:5000';
  }
  // Web, iOS Simulator, or default
  return 'http://localhost:5000';
};

let currentBaseUrl = getDefaultBaseUrl();

export const setCustomBaseUrl = async (url: string): Promise<void> => {
  currentBaseUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(API_URL_KEY, currentBaseUrl);
};

export const getBaseUrl = (): string => currentBaseUrl;

export const initBaseUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    if (saved) {
      currentBaseUrl = saved;
    }
  } catch {
    // fallback to default
  }
  return currentBaseUrl;
};

// Authentication state storage helpers
export const getStoredToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setStoredAuth = async (token: string, user: User): Promise<void> => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const clearStoredAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

// Generic Fetch helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is used (fetch sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${currentBaseUrl}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  auth: {
    sendOtp: async (phone: string): Promise<{ success: boolean; message: string; mockOtp?: string }> => {
      return request('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },

    verifyOtp: async (
      phone: string,
      otp: string
    ): Promise<{ success: boolean; data: { token: string; user: User } }> => {
      const res = await request<{ success: boolean; data: { token: string; user: User } }>(
        '/api/auth/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ phone, otp }),
        }
      );
      if (res.data?.token && res.data?.user) {
        await setStoredAuth(res.data.token, res.data.user);
      }
      return res;
    },

    getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
      return request('/api/auth/me');
    },

    logout: async (): Promise<void> => {
      await clearStoredAuth();
    },
  },

  loans: {
    getSummary: async (): Promise<{ success: boolean; data: { summary: LoanSummary } }> => {
      return request('/api/loans/summary');
    },

    getAll: async (params?: {
      status?: string;
      search?: string;
    }): Promise<{ success: boolean; data: { loans: Loan[] } }> => {
      const queryParts: string[] = [];
      if (params?.status && params.status !== 'all') {
        queryParts.push(`status=${encodeURIComponent(params.status)}`);
      }
      if (params?.search && params.search.trim()) {
        queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
      }
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return request(`/api/loans${queryString}`);
    },

    create: async (
      data: {
        friend_name: string;
        amount: number;
        due_date: string;
        notes?: string;
      },
      receiptUri?: string
    ): Promise<{ success: boolean; data: { loan: Loan } }> => {
      if (receiptUri) {
        // Multipart upload
        const formData = new FormData();
        formData.append('friend_name', data.friend_name);
        formData.append('amount', data.amount.toString());
        formData.append('due_date', data.due_date);
        if (data.notes) formData.append('notes', data.notes);

        const filename = receiptUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // React Native multipart file format
        formData.append('receipt', {
          uri: receiptUri,
          name: filename,
          type,
        } as any);

        return request('/api/loans', {
          method: 'POST',
          body: formData,
        });
      } else {
        // JSON body
        return request('/api/loans', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },

    markAsRepaid: async (id: string): Promise<{ success: boolean; data: { loan: Loan } }> => {
      return request(`/api/loans/${id}/repay`, {
        method: 'PATCH',
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
      return request(`/api/loans/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
