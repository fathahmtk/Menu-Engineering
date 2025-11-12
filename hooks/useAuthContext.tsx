
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Mock types to avoid importing from Supabase
interface MockUser {
  id: string;
  email?: string;
}
interface MockSession {
  user: MockUser | null;
}

interface AuthContextType {
  session: MockSession | null;
  user: MockUser | null;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockUser: MockUser = { id: 'mock-user-123', email: 'user@example.com' };
  const mockSession: MockSession = { user: mockUser };

  const signOut = () => {
    console.log("Signing out... (mocked)");
    // This is a mock function. In a real scenario, this would clear the session.
    // For this app, we'll keep the user logged in to allow continued use.
    alert("Sign out is disabled in this version.");
  };

  const value = {
    session: mockSession,
    user: mockUser,
    signOut,
    loading: false, // Set to false as authentication is now instant.
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};