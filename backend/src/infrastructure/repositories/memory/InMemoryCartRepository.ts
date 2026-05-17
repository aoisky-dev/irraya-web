import type { Cart } from "../../../domain/cart/Cart.js";
import type { CartRepository } from "../../../domain/cart/CartRepository.js";

export class InMemoryCartRepository implements CartRepository {
  private readonly carts = new Map<string, Cart>();

  constructor(seedCarts: Cart[] = []) {
    for (const cart of seedCarts) {
      this.carts.set(cart.id, cart);
    }
  }

  async findById(id: string): Promise<Cart | null> {
    return this.carts.get(id) ?? null;
  }

  async save(cart: Cart): Promise<void> {
    this.carts.set(cart.id, cart);
  }
}

