"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  avatar: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  email_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password2: string;
}

interface ErrorResponse {
  error?: string;
  errors?: Record<string, string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get initial auth state from localStorage synchronously
const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  
  const storedToken = localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user');
  
  if (storedToken && storedUser) {
    try {
      return {
        token: storedToken,
        user: JSON.parse(storedUser)
      };
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
  }
  return { token: null, user: null };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialAuthState().user);
  const [token, setToken] = useState<string | null>(() => getInitialAuthState().token);
  const router = useRouter();

  // Only set axios header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login/`, { email, password });
      
      if (response.data.success) {
        const { access, refresh, user } = response.data;
        
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));
        
        setToken(access);
        setUser(user);
        
        toast.success('Login successful!');
        router.push('/');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/register/`, userData);
      
      if (response.data.success) {
        toast.success('Registration successful! Please verify your email.');
        router.push('/login');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errors = axiosError.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((err) => {
          if (Array.isArray(err)) {
            toast.error(err[0]);
          }
        });
      } else {
        toast.error('Registration failed');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await axios.put(`${apiUrl}/api/auth/profile/update/`, data);
      
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user } as User;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await axios.post(`${apiUrl}/api/auth/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword
      });
      toast.success('Password changed successfully');
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Failed to change password');
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await axios.post(`${apiUrl}/api/auth/forgot-password/`, { email });
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error('Failed to send reset link');
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await axios.post(`${apiUrl}/api/auth/reset-password/`, {
        token,
        new_password: newPassword,
        confirm_password: newPassword
      });
      toast.success('Password reset successful. Please login.');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to reset password');
      throw error;
    }
  };

  const isLoading = false;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}