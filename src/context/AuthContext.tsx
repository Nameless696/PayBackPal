import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../api/apiService';
import StorageService from '../services/storageService';
import * as AuthService from '../services/authService';
import type { User, LoginResult, SignupResult } from '../types';

interface AuthContextValue {
  user: User | null;
  isInitialized: boolean;
  login:        (email: string, password: string) => Promise<LoginResult>;
  signup:       (name: string, email: string, password: string) => Promise<SignupResult>;
  verifyEmail:  (email: string, code: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  resendCode:   (email: string) => Promise<void>;
  logout:       () => Promise<void>;
  updateProfile:(updates: Partial<User>) => Promise<boolean>;
  deleteAccount:() => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [isInitialized, setInitialized] = useState(false);

  // Init on mount — hydrate token + user from storage
  useEffect(() => {
    (async () => {
      try {
        await ApiService.initToken();
        const savedUser = await StorageService.getUser();
        if (savedUser) setUser(savedUser);
      } catch (e) {
        console.warn('Auth init failed:', e);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await AuthService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      await StorageService.saveUser(result.user);
    }
    return result;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<SignupResult> => {
    return AuthService.signup(name, email, password);
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const result = await AuthService.verifyEmail(email, code);
    if (result.success && result.user) {
      setUser(result.user);
      await StorageService.saveUser(result.user);
    }
    return result;
  }, []);

  const resendCode = useCallback(async (email: string) => {
    await AuthService.resendCode(email);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    const result = await AuthService.deleteAccount();
    if (result.success) setUser(null);
    return result;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    const result = await AuthService.updateProfile(updates);
    if (result.success && result.user) {
      setUser(result.user);
      await StorageService.saveUser(result.user);
    }
    return result.success;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, signup, verifyEmail, resendCode, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
