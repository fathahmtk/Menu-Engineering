
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
  signIn: (email?: string) => void;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<MockSession | null>(null);

  const signIn = (email: string = 'user@example.com') => {
    const mockUser: MockUser = { id: 'mock-user-123', email };
    const mockSession: MockSession = { user: mockUser };
    setSession(mockSession);
  };

  const signOut = () => {
    setSession(null);
  };

  const value = {
    session,
    user: session?.user ?? null,
    signIn,
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
