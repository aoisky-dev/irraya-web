import type { Order, Payment } from "../types";
import { apiRequest } from "./client";

export async function createOrderFromCart(cartId: string): Promise<Order> {
  return apiRequest<Order>(`/checkout/${cartId}`, {
    method: "POST"
  });
}

export async function authorizeOrderPayment(orderId: string, amountInCents: number): Promise<Payment> {
  return apiRequest<Payment>(`/payments/${orderId}/authorize`, {
    method: "POST",
    body: JSON.stringify({ amountInCents })
  });
}

