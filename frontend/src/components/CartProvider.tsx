"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Cart, CartItem } from "@/lib/types";
import { getCart, createCart, addItemToCart, removeItemFromCart, updateItemQuantity, applyPromoCode, removePromoCode } from "@/lib/api/cart";

/** Extra display info stored client-side alongside the API cart */
interface CartItemMeta {
  title: string;
  image?: string;
  size: string;
  color: string;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemMeta: Map<string, CartItemMeta>;
  addItem: (
    productId: string,
    variantId: string,
    quantity: number,
    meta: CartItemMeta
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  applyPromo: (code: string) => Promise<void>;
  removePromo: (code: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const META_STORAGE_KEY = "irraya_cart_meta";

function loadMeta(): Map<string, CartItemMeta> {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) {
      const entries: [string, CartItemMeta][] = JSON.parse(raw);
      return new Map(entries);
    }
  } catch { /* ignore */ }
  return new Map();
}

function saveMeta(meta: Map<string, CartItemMeta>) {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify([...meta.entries()]));
  } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemMeta, setItemMeta] = useState<Map<string, CartItemMeta>>(new Map());

  useEffect(() => {
    const savedCartId = localStorage.getItem("irraya_cart_id");
    const savedMeta = loadMeta();
    setItemMeta(savedMeta);

    if (savedCartId) {
      getCart(savedCartId)
        .then(setCart)
        .catch(() => {
          localStorage.removeItem("irraya_cart_id");
          localStorage.removeItem(META_STORAGE_KEY);
          setCart(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cart?.id) return cart.id;
    const newCart = await createCart();
    localStorage.setItem("irraya_cart_id", newCart.id);
    setCart(newCart);
    return newCart.id;
  }, [cart]);

  const addItem = useCallback(
    async (productId: string, variantId: string, quantity: number, meta: CartItemMeta) => {
      try {
        const cartId = await ensureCart();
        const updatedCart = await addItemToCart(cartId, productId, variantId, quantity);
        setCart(updatedCart);

        // Store meta keyed by variantId (items with same variant get merged)
        setItemMeta((prev) => {
          const next = new Map(prev);
          next.set(variantId, meta);
          saveMeta(next);
          return next;
        });
      } catch (error) {
        console.error("Failed to add item to cart:", error);
        throw error;
      }
    },
    [ensureCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cart) return;
      try {
        const updatedCart = await removeItemFromCart(cart.id, itemId);
        setCart(updatedCart);
      } catch (error) {
        console.error("Failed to remove item:", error);
        throw error;
      }
    },
    [cart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!cart) return;
      try {
        const updatedCart = await updateItemQuantity(cart.id, itemId, quantity);
        setCart(updatedCart);
      } catch (error) {
        console.error("Failed to update quantity:", error);
        throw error;
      }
    },
    [cart]
  );

  const applyPromo = useCallback(
    async (code: string) => {
      if (!cart) return;
      try {
        const updatedCart = await applyPromoCode(cart.id, code);
        setCart(updatedCart);
      } catch (error) {
        console.error("Failed to apply promo:", error);
        throw error;
      }
    },
    [cart]
  );

  const removePromo = useCallback(
    async (code: string) => {
      if (!cart) return;
      try {
        const updatedCart = await removePromoCode(cart.id, code);
        setCart(updatedCart);
      } catch (error) {
        console.error("Failed to remove promo:", error);
        throw error;
      }
    },
    [cart]
  );

  const clearCart = useCallback(() => {
    localStorage.removeItem("irraya_cart_id");
    localStorage.removeItem(META_STORAGE_KEY);
    setCart(null);
    setItemMeta(new Map());
  }, []);

  return (
    <CartContext.Provider value={{ cart, isLoading, itemMeta, addItem, removeItem, updateQuantity, applyPromo, removePromo, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}