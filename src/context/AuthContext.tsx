import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DARK_THEME, LIGHT_THEME, TRANSLATIONS, ThemeColors } from '../theme/colors';
import { useStore } from '../store/useStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface UserSettings {
  dark_mode: boolean;
  language: string;
  currency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile_photo?: string;
  settings: UserSettings;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  theme: ThemeColors;
  isDarkMode: boolean;
  language: string;
  currency: string;
  t: (key: string) => string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  updateProfile: (name: string, profilePhoto?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDarkMode = user?.settings?.dark_mode ?? true;
  const language = user?.settings?.language ?? 'pt';
  const currency = user?.settings?.currency ?? 'EUR';
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('auth_token', access_token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      name,
      email,
      password
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('auth_token', access_token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    useStore.setState({
      clients: [],
      transactions: [],
      categories: [],
      invoices: [],
      summary: null,
    });
  };

  const updateSettings = async (settings: UserSettings) => {
    if (!token) return;
    
    await axios.put(
      `${BACKEND_URL}/api/auth/settings`,
      settings,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const updatedUser = { ...user!, settings };
    await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updateProfile = async (name: string, profilePhoto?: string) => {
    if (!token) return;
    
    const updateData: any = { name };
    if (profilePhoto !== undefined) {
      updateData.profile_photo = profilePhoto;
    }
    
    const response = await axios.put(
      `${BACKEND_URL}/api/auth/profile`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
    setUser(response.data);
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        theme,
        isDarkMode,
        language,
        currency,
        t,
        login,
        register,
        logout,
        updateSettings,
        updateProfile,
        refreshUser,
      }}
    >
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
