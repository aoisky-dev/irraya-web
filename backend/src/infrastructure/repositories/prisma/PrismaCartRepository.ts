import { PrismaClient } from "@prisma/client";
import type { Cart } from "../../../domain/cart/Cart.js";
import type { CartRepository } from "../../../domain/cart/CartRepository.js";

export class PrismaCartRepository implements CartRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Cart | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!cart) return null;
    return {
      id: cart.id,
      customerId: cart.customerId || undefined,
      currencyCode: cart.currencyCode as "usd" | "inr",
      promoCode: cart.promoCode || undefined,
      discountInCents: cart.discountInCents || undefined,
      subtotalInCents: cart.subtotalInCents,
      totalInCents: cart.totalInCents,
      updatedAt: cart.updatedAt,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents
      }))
    };
  }

  async save(cart: Cart): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.cart.upsert({
        where: { id: cart.id },
        update: {
          customerId: cart.customerId || null,
          currencyCode: cart.currencyCode,
          promoCode: cart.promoCode || null,
          discountInCents: cart.discountInCents || null,
          subtotalInCents: cart.subtotalInCents,
          totalInCents: cart.totalInCents,
          updatedAt: cart.updatedAt
        },
        create: {
          id: cart.id,
          customerId: cart.customerId || null,
          currencyCode: cart.currencyCode,
          promoCode: cart.promoCode || null,
          discountInCents: cart.discountInCents || null,
          subtotalInCents: cart.subtotalInCents,
          totalInCents: cart.totalInCents,
          updatedAt: cart.updatedAt
        }
      });

      // Simple approach: delete all items and recreate them
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (cart.items.length > 0) {
        await tx.cartItem.createMany({
          data: cart.items.map(item => ({
            id: item.id,
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPriceInCents: item.unitPriceInCents
          }))
        });
      }
    });
  }
}
