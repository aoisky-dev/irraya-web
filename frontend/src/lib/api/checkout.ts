import type { Order, Payment } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaOrder } from "./medusa-mappers";
import { getOrderById } from "./orders";

const authHeader = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

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

export async function prepareCartForCheckout(cartId: string, form: {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
}, token?: string): Promise<void> {
  const authHeaders = authHeader(token);

  // 1. Update Cart Address
  await medusaRequest(`/store/carts/${cartId}`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email: form.email.trim(),
      shipping_address: {
        first_name: form.firstName,
        last_name: form.lastName,
        address_1: form.address,
        city: form.city,
        country_code: "in",
        postal_code: form.zipCode,
        ...(form.phone ? { phone: form.phone } : {}),
      },
      billing_address: {
        first_name: form.firstName,
        last_name: form.lastName,
        address_1: form.address,
        city: form.city,
        country_code: "in",
        postal_code: form.zipCode,
        ...(form.phone ? { phone: form.phone } : {}),
      }
    })
  });

  // 2. Fetch shipping options
  const optionsRes = await medusaRequest<{ shipping_options?: { id: string }[] }>(
    `/store/shipping-options?cart_id=${cartId}`,
    { headers: authHeaders }
  );

  if (optionsRes.shipping_options && optionsRes.shipping_options.length > 0) {
    // 3. Add first shipping method to cart
    await medusaRequest(`/store/carts/${cartId}/shipping-methods`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ option_id: optionsRes.shipping_options[0].id })
    });
  }
}

export async function createOrderFromCart(cartId: string, token?: string): Promise<Order> {
  const authHeaders = authHeader(token);

  // 1. Ensure payment collection & session exists (required for Medusa v2 cart completion)
  try {
    const cartRes = await medusaRequest<{ cart?: { payment_collection?: { id: string, payment_sessions?: any[] } } }>(
      `/store/carts/${cartId}?fields=*payment_collection,*payment_collection.payment_sessions`,
      { headers: authHeaders }
    );
    let collectionId = cartRes.cart?.payment_collection?.id;

    if (!collectionId) {
      const createRes = await medusaRequest<{ payment_collection?: { id: string } }>("/store/payment-collections", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ cart_id: cartId })
      });
      collectionId = createRes.payment_collection?.id;
    }

    if (collectionId && (!cartRes.cart?.payment_collection?.payment_sessions?.length)) {
      await medusaRequest(`/store/payment-collections/${collectionId}/payment-sessions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ provider_id: "pp_system_default" })
      });
    }
  } catch (err) {
    console.error("Failed to setup payment collection for cart", err);
    // Proceed anyway and let the complete endpoint fail if it has to
  }

  // 2. Complete the cart
  const response = await medusaRequest<{ order?: unknown }>(`/store/carts/${cartId}/complete`, {
    method: "POST",
    headers: authHeaders,
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
  token?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}): Promise<RazorpayPaymentOrder> {
  const authHeaders = authHeader(input.token);
  const response = await medusaRequest<{
    razorpay_order_id?: unknown;
    amount?: unknown;
    currency?: unknown;
    key_id?: unknown;
    status?: unknown;
  }>("/store/payments/razorpay/orders", {
    method: "POST",
    headers: authHeaders,
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
  const currency = String(response.currency ?? input.currencyCode).toLowerCase() === "usd" ? "usd" : "inr";

  return {
    razorpayOrderId: response.razorpay_order_id,
    amountInCents: Number.isFinite(amount) ? Math.round(amount) : input.amountInCents,
    currencyCode: currency,
    keyId: response.key_id,
    status: typeof response.status === "string" ? response.status : "created"
  };
}

export async function verifyRazorpayPayment(input: RazorpayCheckoutVerificationInput & { token?: string }): Promise<Payment> {
  const authHeaders = authHeader(input.token);
  const response = await medusaRequest<{ payment?: Payment }>("/store/payments/razorpay/verify", {
    method: "POST",
    headers: authHeaders,
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

export async function linkRazorpayPaymentToOrder(input: RazorpayOrderLinkInput & { token?: string }): Promise<void> {
  const authHeaders = authHeader(input.token);
  await medusaRequest<{ linked?: boolean }>("/store/payments/razorpay/link-order", {
    method: "POST",
    headers: authHeaders,
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
