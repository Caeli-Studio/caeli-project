import React, { createContext, useContext, useEffect, useState } from "react";

import type { User, AuthResponse } from "@/types/auth";

import { authService } from "@/services/auth.service";
import { apiService } from "@/services/api.service"; // ✅ IMPORTANT

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load authentication on first mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * INITIALIZE AUTH ON APP START
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      await authService.initialize();

      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        setUser(null);
        return;
      }

      // 1️⃣ Check session
      const sessionResult = await authService.getSession();
      if (!sessionResult.success || !sessionResult.user) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // 2️⃣ Load Supabase profile (SOURCE OF TRUTH)
      try {
        const profileRes = await apiService.get("/api/profile/me");

        if (profileRes?.profile) {
          setUser(profileRes.profile);
          return; // ✔ Critical: do not overwrite afterward
        }
      } catch (err) {
        console.log("❌ Impossible de charger le profil Supabase:", err);
      }

      // 3️⃣ Fallback if profile missing
      setUser(sessionResult.user);
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * SIGN IN WITH GOOGLE
   */
  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true);

      const result = await authService.signInWithGoogle();

      if (result.success) {
        // Try to load profile RIGHT AFTER LOGIN
        try {
          const profileRes = await apiService.get("/profile/me");

          if (profileRes?.profile) {
            setUser(profileRes.profile);
            setIsAuthenticated(true);
            return result;
          }
        } catch (err) {
          console.log("❌ Impossible de charger le profil Supabase:", err);
        }

        // Fallback: use auth user if profile missing
        if (result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
        }
      }

      return result;
    } catch (error) {
      console.error("Error signing in:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * SIGN OUT
   */
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * REFRESH TOKEN + RELOAD PROFILE
   */
  const refreshSession = async (): Promise<void> => {
    try {
      const result = await authService.refreshSession();

      if (result.success) {
        // Reload Supabase profile
        try {
          const profileRes = await apiService.get("/profile/me");
          if (profileRes?.profile) {
            setUser(profileRes.profile);
            setIsAuthenticated(true);
            return;
          }
        } catch (err) {
          console.log("❌ Impossible de rafraîchir le profil:", err);
        }

        // fallback
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
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
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
