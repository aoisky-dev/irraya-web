"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { addWishlistProduct, getWishlist, migrateWishlistProducts, removeWishlistProduct } from "@/lib/api/wishlist";

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isSyncing: boolean;
  syncError: string;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncedToken, setSyncedToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("irraya_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {}
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("irraya_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !token || syncedToken === token) return;

    setIsSyncing(true);
    setSyncError("");

    const localWishlist = wishlist;
    const sync = localWishlist.length > 0 ? migrateWishlistProducts(token, localWishlist) : getWishlist(token);

    sync
      .then((serverWishlist) => {
        setWishlist(serverWishlist);
        setSyncedToken(token);
      })
      .catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Wishlist sync failed.");
      })
      .finally(() => setIsSyncing(false));
  }, [isInitialized, syncedToken, token]);

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });

    if (token) {
      addWishlistProduct(token, product).catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Failed to save wishlist item.");
      });
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));

    if (token) {
      removeWishlistProduct(token, productId).catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Failed to remove wishlist item.");
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, isSyncing, syncError }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
