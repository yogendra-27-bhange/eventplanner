
"use client";

import type { User, UserRole } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase'; // Firebase setup
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<User>;
  register: (email: string, name: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use a different key for session state, user profile is now in Firestore
const SESSION_USER_ID_KEY = 'event-planner-session-userId'; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const sessionUserId = localStorage.getItem(SESSION_USER_ID_KEY);
        if (sessionUserId) {
          const userRef = doc(db, "users", sessionUserId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as User);
          } else {
            // User in session but not in DB, clear session
            localStorage.removeItem(SESSION_USER_ID_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to load user from session/Firestore:", error);
        localStorage.removeItem(SESSION_USER_ID_KEY); // Clear inconsistent session
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const updateUserInSessionAndState = (user: User | null) => {
    if (user) {
      localStorage.setItem(SESSION_USER_ID_KEY, user.id);
    } else {
      localStorage.removeItem(SESSION_USER_ID_KEY);
    }
    setCurrentUser(user);
  };

  const login = useCallback(async (email: string, name?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", email); // Using email as ID for simplicity
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        updateUserInSessionAndState(userData);
        setIsLoading(false);
        return userData;
      } else {
        // User not found, for this mock login, let's treat it like a registration if name is provided
        // Or simply fail if it's a strict login attempt
        // For now, let's create if name is provided (or default name)
        const defaultName = name || email.split('@')[0];
        const role: UserRole = email === 'admin@example.com' ? 'admin' : 'user';
        const newUser: User = { id: email, email, name: defaultName, role };
        await setDoc(userRef, newUser);
        updateUserInSessionAndState(newUser);
        setIsLoading(false);
        return newUser;
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error);
      throw error;
    }
  }, []);
  
  const register = useCallback(async (email: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", email); // Using email as ID
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setIsLoading(false);
        throw new Error("User already exists with this email.");
      }
      
      const role: UserRole = email === 'admin@example.com' ? 'admin' : 'user'; // Admin role for specific email
      const newUser: User = { id: email, email, name, role };
      await setDoc(userRef, newUser);
      updateUserInSessionAndState(newUser);
      setIsLoading(false);
      return newUser;
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    updateUserInSessionAndState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, isLoading, login, register, logout }}>
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
