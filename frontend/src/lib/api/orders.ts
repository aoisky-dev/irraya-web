import type { Order } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaOrder } from "./medusa-mappers";

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await medusaRequest<{ order?: unknown }>(`/store/orders/${orderId}`);
  if (!response.order) {
    throw new Error("Order not found");
  }
  return mapMedusaOrder(response.order);
}

export async function getMyOrders(_token: string): Promise<Order[]> {
  const response = await medusaRequest<{ customer?: { orders?: unknown[] } }>("/store/customers/me", {
    headers: {
      Authorization: `Bearer ${_token}`
    }
  });

  return (response.customer?.orders ?? []).map((order) => mapMedusaOrder(order));
}

