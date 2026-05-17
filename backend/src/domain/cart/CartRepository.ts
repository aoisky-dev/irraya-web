import type { Cart } from "./Cart.js";

export interface CartRepository {
  findById(id: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
}

