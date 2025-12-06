import React, { createContext, useContext, useEffect, useState } from 'react';

import type { User, AuthResponse } from '@/types/auth';

import { authService } from '@/services/auth.service';


function normalizeUser(user: User): User {
  return {
    ...user,
    display_name: user.display_name ?? user.name ?? null,
    name: user.display_name ?? user.name ?? null, // toujours afficher display_name
  };
}


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserName: (newNickname: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      await authService.initialize();

      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        const sessionResult = await authService.getSession();
        if (sessionResult.success && sessionResult.user) {
          setUser(normalizeUser(sessionResult.user));
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update username using authService
   */
  const updateUserName = async (newNickname: string): Promise<boolean> => {
    if (!user) {
      console.error('Cannot update name: user is null.');
      return false;
    }

    try {
      console.log('📨 Calling updateUserName from Context...');

      const result = await authService.updateUserName(newNickname);

      if (result.success && result.user) {
        console.log('✅ Username updated:', result.user);
        setUser(normalizeUser(result.user));
        return true;
      } else {
        console.error('❌ Error updating username:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error in AuthContext.updateUserName:', error);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const result = await authService.signInWithGoogle();

      if (result.success && result.user) {
        setUser(normalizeUser(result.user));
        setIsAuthenticated(true);
      }

      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const result = await authService.refreshSession();
      if (result.success && result.user) {
        setUser(normalizeUser(result.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signInWithGoogle,
        signOut,
        refreshSession,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
