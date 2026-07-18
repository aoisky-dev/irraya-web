"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { clearCompareList, getCompareList, syncCompareList } from "@/lib/api/compare";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  isSyncing: boolean;
  syncError: string;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncedToken, setSyncedToken] = useState<string | null>(null);

  // Optional: Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("irraya_compare");
      if (saved) setCompareItems(JSON.parse(saved));
    } catch {}
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("irraya_compare", JSON.stringify(compareItems));
    }
  }, [compareItems, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !token || syncedToken === token) return;

    setIsSyncing(true);
    setSyncError("");

    getCompareList(token)
      .then((serverItems) => {
        const merged = [...compareItems, ...serverItems].filter(
          (product, index, all) => all.findIndex((item) => item.id === product.id) === index
        ).slice(0, 4);
        return syncCompareList(token, merged);
      })
      .then((savedItems) => {
        setCompareItems(savedItems);
        setSyncedToken(token);
      })
      .catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Compare sync failed.");
      })
      .finally(() => setIsSyncing(false));
  }, [isInitialized, syncedToken, token]);

  const persistCompare = (nextItems: Product[]) => {
    if (!token) return;
    syncCompareList(token, nextItems).catch((error: unknown) => {
      setSyncError(error instanceof Error ? error.message : "Failed to sync compare list.");
    });
  };

  const addToCompare = (product: Product) => {
    setCompareItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      if (prev.length >= 4) return prev; // max 4 items to compare
      const next = [...prev, product];
      persistCompare(next);
      return next;
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      persistCompare(next);
      return next;
    });
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((p) => p.id === productId);
  };

  const clearCompare = () => {
    setCompareItems([]);
    if (token) {
      clearCompareList(token).catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Failed to clear compare list.");
      });
    }
  };

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, isInCompare, clearCompare, isSyncing, syncError }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
