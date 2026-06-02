import type { Cart } from "../types";
import { apiRequest } from "./client";

export async function getCart(cartId: string): Promise<Cart> {
  return await apiRequest<Cart>(`/carts/${cartId}`);
}

export async function createCart(): Promise<Cart> {
  return await apiRequest<Cart>('/carts', {
    method: 'POST'
  });
}

export async function addItemToCart(
  cartId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<Cart> {
  return await apiRequest<Cart>(`/carts/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ productId, variantId, quantity })
  });
}

export async function removeItemFromCart(cartId: string, itemId: string): Promise<Cart> {
  return await apiRequest<Cart>(`/carts/${cartId}/items/${itemId}`, {
    method: 'DELETE'
  });
}

export async function updateItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  return await apiRequest<Cart>(`/carts/${cartId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity })
  });
}

export async function applyPromoCode(cartId: string, code: string): Promise<Cart> {
  return await apiRequest<Cart>(`/carts/${cartId}/promo`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}
