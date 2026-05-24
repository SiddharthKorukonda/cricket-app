import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken, User } from '../api/client';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'cricscore_token';
const USER_KEY = 'cricscore_user';
const REMEMBER_KEY = 'cricscore_remember';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const remember = await AsyncStorage.getItem(REMEMBER_KEY);
        let storedToken: string | null = null;
        if (remember === 'true') {
          storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        } else {
          storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        }
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = async (u: User, t: string, rememberMe: boolean) => {
    setAuthToken(t);
    setToken(t);
    setUser(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    await AsyncStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');
    if (rememberMe) {
      await SecureStore.setItemAsync(TOKEN_KEY, t);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, t);
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    }
  };

  const login = useCallback(async (username: string, password: string, rememberMe: boolean) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', {
      username,
      password,
      rememberMe,
    });
    await persistSession(res.user, res.token, rememberMe);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<{ user: User; token: string }>('/auth/register', data);
    await persistSession(res.user, res.token, false);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REMEMBER_KEY]);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
