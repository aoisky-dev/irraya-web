import type { Order, Payment } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaOrder } from "./medusa-mappers";
import { getOrderById } from "./orders";

export interface RazorpayPaymentOrder {
  razorpayOrderId: string;
  amountInCents: number;
  currencyCode: "usd" | "inr";
  keyId: string;
  status: string;
}

export interface RazorpayCheckoutVerificationInput {
  cartId: string;
  orderId?: string;
  amountInCents: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayOrderLinkInput {
  cartId: string;
  orderId: string;
  amountInCents: number;
  currencyCode: "usd" | "inr";
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status?: "authorized" | "captured";
}

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
  return {
    id: `pay_${orderId}`,
    orderId,
    provider: "mock",
    amountInCents,
    status: "authorized",
    providerReference: `medusa_${orderId}`
  };
}

export async function createRazorpayPaymentOrder(input: {
  cartId: string;
  amountInCents: number;
  currencyCode: "usd" | "inr";
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}): Promise<RazorpayPaymentOrder> {
  const response = await medusaRequest<{
    razorpay_order_id?: unknown;
    amount?: unknown;
    currency?: unknown;
    key_id?: unknown;
    status?: unknown;
  }>("/store/payments/razorpay/orders", {
    method: "POST",
    body: JSON.stringify({
      cart_id: input.cartId,
      amount: input.amountInCents,
      currency: input.currencyCode.toUpperCase(),
      customer: input.customer
    })
  });

  if (typeof response.razorpay_order_id !== "string" || typeof response.key_id !== "string") {
    throw new Error("Razorpay order response is incomplete.");
  }

  const amount = typeof response.amount === "number" ? response.amount : Number(response.amount);
  const currency = String(response.currency ?? input.currencyCode).toLowerCase() === "inr" ? "inr" : "usd";

  return {
    razorpayOrderId: response.razorpay_order_id,
    amountInCents: Number.isFinite(amount) ? Math.round(amount) : input.amountInCents,
    currencyCode: currency,
    keyId: response.key_id,
    status: typeof response.status === "string" ? response.status : "created"
  };
}

export async function verifyRazorpayPayment(input: RazorpayCheckoutVerificationInput): Promise<Payment> {
  const response = await medusaRequest<{ payment?: Payment }>("/store/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify({
      cart_id: input.cartId,
      order_id: input.orderId,
      amount: input.amountInCents,
      razorpay_order_id: input.razorpayOrderId,
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_signature: input.razorpaySignature
    })
  });

  if (!response.payment) {
    throw new Error("Razorpay verification did not return payment details.");
  }

  return response.payment;
}

export async function linkRazorpayPaymentToOrder(input: RazorpayOrderLinkInput): Promise<void> {
  await medusaRequest<{ linked?: boolean }>("/store/payments/razorpay/link-order", {
    method: "POST",
    body: JSON.stringify({
      cart_id: input.cartId,
      order_id: input.orderId,
      amount: input.amountInCents,
      currency: input.currencyCode.toUpperCase(),
      razorpay_order_id: input.razorpayOrderId,
      razorpay_payment_id: input.razorpayPaymentId,
      status: input.status ?? "authorized"
    })
  });
}

export { getOrderById };
