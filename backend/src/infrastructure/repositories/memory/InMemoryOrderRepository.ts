import type { Order } from "../../../domain/orders/Order.js";
import type { OrderRepository } from "../../../domain/orders/OrderRepository.js";

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }
}

