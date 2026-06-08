"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/lib/types";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const addToCompare = (product: Product) => {
    setCompareItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      if (prev.length >= 4) return prev; // max 4 items to compare
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((p) => p.id === productId);
  };

  const clearCompare = () => setCompareItems([]);

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
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
