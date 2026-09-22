import type { Order, OrderRequest, OrderRequestItem, OrderRequestType } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaOrder } from "./medusa-mappers";

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const response = await medusaRequest<{ order?: unknown }>(
      `/store/orders/${orderId}?fields=*items,*shipping_address,*payment_collections,*payment_collections.payment_sessions`
    );
    if (!response.order) return null;
    return mapMedusaOrder(response.order);
  } catch {
    return null;
  }
}

export async function getMyOrders(token: string): Promise<Order[]> {
  try {
    const response = await medusaRequest<{ orders?: unknown[]; order?: unknown[] }>(
      "/store/orders?limit=50&fields=*items,*payment_collections,*payment_collections.payment_sessions",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const orders = response.orders ?? (Array.isArray(response.order) ? response.order : []);
    return orders.map((o) => mapMedusaOrder(o));
  } catch {
    // Fallback: try fetching via customer profile with expanded orders
    const response = await medusaRequest<{ customer?: { orders?: unknown[] } }>(
      "/store/customers/me?fields=*orders",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return (response.customer?.orders ?? []).map((o) => mapMedusaOrder(o));
  }
}

type OrderRequestApiRow = {
  id?: unknown;
  order_id?: unknown;
  request_type?: unknown;
  status?: unknown;
  reason?: unknown;
  notes?: unknown;
  items?: unknown;
  tracking_number?: unknown;
  tracking_url?: unknown;
  refund_reference?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

const mapOrderRequest = (row: OrderRequestApiRow): OrderRequest => ({
  id: String(row.id ?? ""),
  orderId: String(row.order_id ?? ""),
  type: String(row.request_type ?? "return") as OrderRequest["type"],
  status: String(row.status ?? "requested") as OrderRequest["status"],
  reason: String(row.reason ?? ""),
  notes: typeof row.notes === "string" ? row.notes : undefined,
  items: Array.isArray(row.items)
    ? row.items.map((item: any): OrderRequestItem => ({
        itemId: item?.item_id ? String(item.item_id) : undefined,
        productId: item?.product_id ? String(item.product_id) : undefined,
        variantId: item?.variant_id ? String(item.variant_id) : undefined,
        quantity: typeof item?.quantity === "number" ? item.quantity : undefined
      }))
    : [],
  trackingNumber: typeof row.tracking_number === "string" ? row.tracking_number : undefined,
  trackingUrl: typeof row.tracking_url === "string" ? row.tracking_url : undefined,
  refundReference: typeof row.refund_reference === "string" ? row.refund_reference : undefined,
  createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString()
});

export async function getOrderRequests(token: string, orderId?: string): Promise<OrderRequest[]> {
  const query = orderId ? `?${new URLSearchParams({ order_id: orderId }).toString()}` : "";
  const response = await medusaRequest<{ requests?: OrderRequestApiRow[] }>(`/store/customers/me/order-requests${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return (response.requests ?? []).map(mapOrderRequest);
}

export async function createOrderRequest(input: {
  token: string;
  orderId: string;
  type: OrderRequestType;
  reason: string;
  notes?: string;
  items?: OrderRequestItem[];
}): Promise<{ request: OrderRequest; message: string }> {
  const response = await medusaRequest<{ request?: OrderRequestApiRow; message?: string }>("/store/customers/me/order-requests", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      order_id: input.orderId,
      request_type: input.type,
      reason: input.reason,
      notes: input.notes,
      items: input.items?.map((item) => ({
        item_id: item.itemId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity
      })) ?? []
    })
  });

  if (!response.request) {
    throw new Error("Order request response is incomplete.");
  }

  return {
    request: mapOrderRequest(response.request),
    message: response.message || "Request submitted."
  };
}

export function buildInvoiceText(order: Order): string {
  const lines = [
    "Irraya Fashion Invoice",
    `Order ID: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
    `Status: ${order.status}`,
    `Payment: ${order.payment?.status ?? "authorized"}`,
    "",
    "Items:",
    ...order.items.map((item) => `${item.title ?? "Product"} x ${item.quantity} - ${item.unitPriceInCents * item.quantity} ${order.currencyCode.toUpperCase()}`),
    "",
    `Total: ${order.totalInCents} ${order.currencyCode.toUpperCase()}`,
    order.payment?.providerPaymentId ? `Razorpay Payment ID: ${order.payment.providerPaymentId}` : "",
    "",
    "Thank you for shopping with Irraya."
  ].filter(Boolean);

  return lines.join("\n");
}

