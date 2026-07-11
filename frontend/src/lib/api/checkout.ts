import type { Order, Payment } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaOrder } from "./medusa-mappers";
import { getOrderById } from "./orders";

export async function createOrderFromCart(cartId: string): Promise<Order> {
  const response = await medusaRequest<{ order?: unknown }>(`/store/carts/${cartId}/complete`, {
    method: "POST"
  });

  if (!response.order) {
    throw new Error("Checkout did not return an order.");
  }

  return mapMedusaOrder(response.order, cartId);
}

export async function authorizeOrderPayment(orderId: string, amountInCents: number): Promise<Payment> {
  // In Medusa native flow, payment is usually captured/managed by checkout workflow.
  return {
    id: `pay_${orderId}`,
    orderId,
    provider: "stripe",
    amountInCents,
    status: "authorized",
    providerReference: `medusa_${orderId}`
  };
}

export { getOrderById };
