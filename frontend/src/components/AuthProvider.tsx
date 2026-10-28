"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User } from "@/lib/types";
import { getMe } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "irraya_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // 1. Check HttpOnly cookie session via server route
        const res = await fetch("/api/auth/session");
        const data = res.ok ? await res.json() : null;
        let activeToken = data?.authenticated && typeof data.token === "string" ? data.token : null;

        // 2. Migration fallback: check legacy localStorage token and migrate it to HttpOnly cookie
        if (!activeToken) {
          const legacyToken = localStorage.getItem(TOKEN_KEY);
          if (legacyToken) {
            activeToken = legacyToken;
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: legacyToken }),
            }).catch(() => {});
            localStorage.removeItem(TOKEN_KEY);
          }
        } else {
          // Clear any legacy localStorage token
          localStorage.removeItem(TOKEN_KEY);
        }

        if (activeToken && isMounted) {
          setToken(activeToken);
          const userData = await getMe(activeToken);
          if (isMounted) {
            setUser(userData);
          }
        }
      } catch {
        // Token invalid or expired
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem("irraya_cart_id");
          localStorage.removeItem("irraya_cart_meta");
        } catch {}
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: newToken }),
    }).catch((err) => {
      console.error("Failed to establish session cookie", err);
    });

    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}

    setToken(newToken);
    setUser(newUser);
  }, []);

  // Register logout as the global 401 handler so any expired-token API call
  // automatically clears the session instead of silently failing.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {}
      setToken(null);
      setUser(null);
    });
  }, []);

  const logout = () => {
    fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("irraya_cart_id");
      localStorage.removeItem("irraya_cart_meta");
    } catch {}
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const updated = await getMe(token);
      setUser(updated);
    } catch {
      // silent — stale user state is acceptable
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
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
