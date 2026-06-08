import { PrismaClient } from "@prisma/client";
import type { Order, OrderStatus } from "../../../domain/orders/Order.js";
import type { OrderRepository } from "../../../domain/orders/OrderRepository.js";

export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) return null;
    return {
      id: order.id,
      cartId: order.cartId,
      customerId: order.customerId || undefined,
      status: order.status as OrderStatus,
      currencyCode: order.currencyCode as "usd" | "inr",
      totalInCents: order.totalInCents,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents
      }))
    };
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(order => ({
      id: order.id,
      cartId: order.cartId,
      customerId: order.customerId || undefined,
      status: order.status as OrderStatus,
      currencyCode: order.currencyCode as "usd" | "inr",
      totalInCents: order.totalInCents,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents
      }))
    }));
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(order => ({
      id: order.id,
      cartId: order.cartId,
      customerId: order.customerId || undefined,
      status: order.status as OrderStatus,
      currencyCode: order.currencyCode as "usd" | "inr",
      totalInCents: order.totalInCents,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents
      }))
    }));
  }

  async save(order: Order): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: order.id },
        update: {
          cartId: order.cartId,
          customerId: order.customerId || null,
          status: order.status,
          currencyCode: order.currencyCode,
          totalInCents: order.totalInCents
        },
        create: {
          id: order.id,
          cartId: order.cartId,
          customerId: order.customerId || null,
          status: order.status,
          currencyCode: order.currencyCode,
          totalInCents: order.totalInCents,
          createdAt: order.createdAt
        }
      });

      // Simple approach: delete all items and recreate them
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      if (order.items.length > 0) {
        await tx.orderItem.createMany({
          data: order.items.map(item => ({
            id: item.id,
            orderId: order.id,
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
