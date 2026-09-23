import type { Cart } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaCart } from "./medusa-mappers";

export async function getCart(cartId: string): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown }>(`/store/carts/${cartId}`);
  return mapMedusaCart(response.cart);
}

export async function createCart(): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown }>("/store/carts", {
    method: "POST",
    body: JSON.stringify({ currency_code: "inr" })
  });
  return mapMedusaCart(response.cart);
}

export async function addItemToCart(
  cartId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown }>(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity })
  });
  return mapMedusaCart(response.cart);
}

export async function removeItemFromCart(cartId: string, itemId: string): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown; parent?: unknown }>(`/store/carts/${cartId}/line-items/${itemId}`, {
    method: "DELETE"
  });
  return mapMedusaCart(response.cart ?? response.parent);
}

export async function updateItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown; parent?: unknown }>(`/store/carts/${cartId}/line-items/${itemId}`, {
    method: "POST",
    body: JSON.stringify({ quantity })
  });
  return mapMedusaCart(response.cart ?? response.parent);
}

export async function applyPromoCode(cartId: string, code: string): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown; parent?: unknown }>(`/store/carts/${cartId}/promotions`, {
    method: "POST",
    body: JSON.stringify({ promo_codes: [code] })
  });
  return mapMedusaCart(response.cart ?? response.parent);
}

export async function removePromoCode(cartId: string, code: string): Promise<Cart> {
  const response = await medusaRequest<{ cart?: unknown; parent?: unknown }>(`/store/carts/${cartId}/promotions`, {
    method: "DELETE",
    body: JSON.stringify({ promo_codes: [code] })
  });
  return mapMedusaCart(response.cart ?? response.parent);
}
