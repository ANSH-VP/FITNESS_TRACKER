import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initStorage,
  getCurrentSession,
  setCurrentSession,
  clearSession,
  findUserByEmail,
  registerUser as storageRegisterUser,
  updateUserProfile as storageUpdateUser
} from '../services/storageService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize storage seeds and verify active session on mount
  useEffect(() => {
    initStorage();
    const session = getCurrentSession();
    if (session) {
      // Refresh current user info from master users list to ensure fresh data
      const freshUser = findUserByEmail(session.email);
      if (freshUser) {
        setUser(freshUser);
        setCurrentSession(freshUser);
      } else {
        clearSession();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (email, password) => {
    const foundUser = findUserByEmail(email);
    if (!foundUser) {
      throw new Error('No registered account found with this email.');
    }
    if (foundUser.password !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }
    setUser(foundUser);
    setCurrentSession(foundUser);
    return foundUser;
  };

  const registerNewUser = (userData) => {
    const newUser = storageRegisterUser(userData);
    setUser(newUser);
    setCurrentSession(newUser);
    return newUser;
  };

  const logoutUser = () => {
    clearSession();
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    if (!user) throw new Error('No authenticated user session.');
    const updated = storageUpdateUser(user.id, updatedFields);
    setUser(updated);
    return updated;
  };

  const refreshUser = () => {
    if (!user) return;
    const fresh = findUserByEmail(user.email);
    if (fresh) {
      setUser(fresh);
      setCurrentSession(fresh);
    }
  };

  const value = {
    user,
    isAdmin: Boolean(user && user.role === 'admin'),
    loading,
    login: loginUser,
    register: registerNewUser,
    logout: logoutUser,
    updateProfile,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
