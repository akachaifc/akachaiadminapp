
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
// SWITCHING TO REAL BACKEND
import { FirebaseService } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (email: string, username: string, password?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Persistence logic would go here using onAuthStateChanged from firebase/auth
  // For now, we keep the basic flow

  const login = async (identifier: string, password?: string) => {
    setLoading(true);
    try {
      const userData = await FirebaseService.login(identifier, password);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password?: string) => {
    setLoading(true);
    try {
      const userData = await FirebaseService.register(email, username, password);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await FirebaseService.sendPasswordResetEmail(email);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await FirebaseService.logout();
    setUser(null);
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = await FirebaseService.updateUserProfile(user.uid, data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, resetPassword, logout, hasRole, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
