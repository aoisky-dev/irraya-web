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

  async createCart(cartId: string, currencyCode: "usd" | "inr"): Promise<Cart> {
    const cart: Cart = {
      id: cartId,
      currencyCode: currencyCode,
      items: [],
      subtotalInCents: 0,
      totalInCents: 0,
      updatedAt: new Date()
    };
    await this.cartRepository.save(cart);
    return cart;
  }

  async addItem(cartId: string, itemData: { productId: string; variantId: string; quantity: number; unitPriceInCents: number }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    
    const existingItemIndex = cart.items.findIndex(i => i.variantId === itemData.variantId);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += itemData.quantity;
    } else {
      cart.items.push({
        id: `item_${Date.now()}`,
        productId: itemData.productId,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        unitPriceInCents: itemData.unitPriceInCents
      });
    }

    await this.cartRepository.save(cart);
    return this.recalculate(cartId);
  }

  async recalculate(cartId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const subtotalInCents = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceInCents,
      0
    );

    let discountInCents = 0;
    if (cart.promoCode === "WELCOME10") {
      discountInCents = Math.round(subtotalInCents * 0.10);
    } else if (cart.promoCode === "SAVE500") {
      discountInCents = 50000; // 500 INR
    }

    // Ensure total is never negative
    const totalInCents = Math.max(0, subtotalInCents - discountInCents);

    const updatedCart: Cart = {
      ...cart,
      subtotalInCents,
      discountInCents,
      totalInCents,
      updatedAt: new Date()
    };

    await this.cartRepository.save(updatedCart);
    return updatedCart;
  }

  async applyPromoCode(cartId: string, code: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const validCodes = ["WELCOME10", "SAVE500"];
    
    if (!code) {
      cart.promoCode = undefined;
    } else if (validCodes.includes(code.toUpperCase())) {
      cart.promoCode = code.toUpperCase();
    } else {
      throw new AppError("Invalid promo code", "INVALID_PROMO", 400);
    }

    await this.cartRepository.save(cart);
    return this.recalculate(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    cart.items = cart.items.filter(i => i.id !== itemId);
    await this.cartRepository.save(cart);
    return this.recalculate(cartId);
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const item = cart.items.find(i => i.id === itemId);

    if (!item) {
      throw new AppError("Cart item not found", "ITEM_NOT_FOUND", 404);
    }

    if (quantity <= 0) {
      return this.removeItem(cartId, itemId);
    }

    item.quantity = quantity;
    await this.cartRepository.save(cart);
    return this.recalculate(cartId);
  }
  async clearCart(cartId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    cart.items = [];
    cart.promoCode = undefined;
    cart.discountInCents = undefined;
    await this.cartRepository.save(cart);
    return this.recalculate(cartId);
  }
}

