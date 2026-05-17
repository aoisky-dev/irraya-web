import { AppError } from "../../shared/errors/AppError.js";
import type { Cart } from "./Cart.js";
import type { CartRepository } from "./CartRepository.js";

export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw new AppError("Cart not found", "CART_NOT_FOUND", 404);
    }

    return cart;
  }

  async recalculate(cartId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const subtotalInCents = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceInCents,
      0
    );

    const updatedCart: Cart = {
      ...cart,
      subtotalInCents,
      totalInCents: subtotalInCents,
      updatedAt: new Date()
    };

    await this.cartRepository.save(updatedCart);
    return updatedCart;
  }
}

