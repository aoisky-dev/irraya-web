import { AppError } from "../../shared/errors/AppError.js";
import type { CartService } from "../cart/CartService.js";
import type { Order } from "./Order.js";
import type { OrderRepository } from "./OrderRepository.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService
  ) {}

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", "ORDER_NOT_FOUND", 404);
    }

    return order;
  }

  async listAllOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async createFromCart(cartId: string): Promise<Order> {
    const cart = await this.cartService.getCart(cartId);

    if (cart.items.length === 0) {
      throw new AppError("Cannot create order from an empty cart", "EMPTY_CART");
    }

    const order: Order = {
      id: `ord_${Date.now()}`,
      cartId: cart.id,
      customerId: cart.customerId,
      status: "pending",
      currencyCode: cart.currencyCode,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents
      })),
      totalInCents: cart.totalInCents,
      createdAt: new Date()
    };

    await this.orderRepository.save(order);
    return order;
  }
}
