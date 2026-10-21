import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  api,
  getStoredToken,
  getStoredUser,
  initBaseUrl,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; mockOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initBaseUrl();
        const savedToken = await getStoredToken();
        const savedUser = await getStoredUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          // Silently refresh profile
          api.auth
            .getMe()
            .then((res) => {
              if (res.data?.user) setUser(res.data.user);
            })
            .catch(() => {
              // Token might have expired, do not crash
            });
        }
      } catch (err) {
        console.warn('Error restoring auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const sendOtp = async (phone: string) => {
    return api.auth.sendOtp(phone);
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const res = await api.auth.verifyOtp(phone, otp);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
