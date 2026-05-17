import { sampleCart } from "../mock-data";
import type { Cart } from "../types";
import { apiRequest } from "./client";

export async function getCart(cartId: string): Promise<Cart> {
  try {
    return await apiRequest<Cart>(`/carts/${cartId}`);
  } catch {
    return sampleCart;
  }
}

