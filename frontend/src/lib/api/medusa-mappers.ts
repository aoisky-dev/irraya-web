import type { Cart, CartItem, Order, OrderItem, Product, ProductVariant } from "../types";

const normalizeText = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapVariant = (raw: any, productId: string): ProductVariant => {
  const options = (raw?.options ?? raw?.option_values ?? []) as Array<any>;
  const size =
    options.find((v) => (v.option?.title ?? v.option_title ?? "").toLowerCase() === "size")?.value ?? "Default";
  const color =
    options.find((v) => (v.option?.title ?? v.option_title ?? "").toLowerCase() === "color")?.value ??
    "Default";

  return {
    id: normalizeText(raw?.id, `${productId}_variant`),
    sku: normalizeText(raw?.sku, "SKU-NA"),
    size,
    color,
    priceInCents: Math.max(
      0,
      Math.round(
        toNumber(raw?.calculated_price?.calculated_amount ?? raw?.prices?.[0]?.amount ?? raw?.amount, 0)
      )
    ),
    stock: Math.max(0, Math.round(toNumber(raw?.inventory_quantity, 0)))
  };
};

export const mapMedusaProduct = (raw: any): Product => {
  const id = normalizeText(raw?.id, `prod_${Date.now()}`);
  const variantsRaw = Array.isArray(raw?.variants) ? raw.variants : [];
  const variants =
    variantsRaw.length > 0 ? variantsRaw.map((v: unknown) => mapVariant(v, id)) : [mapVariant({}, id)];
  const metadata = raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {};

  return {
    id,
    handle: normalizeText(raw?.handle, id),
    title: normalizeText(raw?.title, "Untitled Product"),
    description: normalizeText(raw?.description, ""),
    category:
      normalizeText(raw?.collection?.title, "") ||
      normalizeText(raw?.type?.value, "") ||
      normalizeText((metadata as Record<string, unknown>).category, "general"),
    status: "published",
    image: normalizeText(raw?.thumbnail ?? raw?.images?.[0]?.url, "") || undefined,
    variants,
    metadata: Object.fromEntries(
      Object.entries(metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
    )
  };
};

const mapCartItem = (raw: any): CartItem => ({
  id: String(raw?.id ?? ""),
  productId: String(raw?.product_id ?? raw?.product?.id ?? ""),
  variantId: String(raw?.variant_id ?? raw?.variant?.id ?? ""),
  quantity: Math.max(0, Math.round(toNumber(raw?.quantity, 0))),
  unitPriceInCents: Math.max(
    0,
    Math.round(toNumber(raw?.unit_price ?? raw?.total / Math.max(toNumber(raw?.quantity, 1), 1), 0))
  )
});

export const mapMedusaCart = (raw: any): Cart => {
  const subtotalInCents = Math.max(0, Math.round(toNumber(raw?.subtotal ?? raw?.subtotal_incl_tax, 0)));
  const totalInCents = Math.max(0, Math.round(toNumber(raw?.total, subtotalInCents)));

  return {
    id: String(raw?.id ?? ""),
    customerId: raw?.customer_id ? String(raw.customer_id) : undefined,
    currencyCode: String(raw?.currency_code ?? "usd").toLowerCase() === "inr" ? "inr" : "usd",
    items: Array.isArray(raw?.items) ? raw.items.map(mapCartItem) : [],
    promoCode: Array.isArray(raw?.promotions) ? raw.promotions[0]?.code : undefined,
    discountInCents: Math.max(0, Math.round(toNumber(raw?.discount_total, Math.max(subtotalInCents - totalInCents, 0)))),
    subtotalInCents,
    totalInCents
  };
};

const mapOrderItem = (raw: any): OrderItem => ({
  id: String(raw?.id ?? ""),
  productId: String(raw?.product_id ?? raw?.product?.id ?? ""),
  variantId: String(raw?.variant_id ?? raw?.variant?.id ?? ""),
  quantity: Math.max(0, Math.round(toNumber(raw?.quantity, 0))),
  unitPriceInCents: Math.max(0, Math.round(toNumber(raw?.unit_price ?? raw?.subtotal, 0)))
});

export const mapMedusaOrder = (raw: any, cartIdFallback?: string): Order => {
  const statusRaw = String(raw?.status ?? "pending").toLowerCase();
  const status =
    statusRaw === "canceled" || statusRaw === "cancelled"
      ? "cancelled"
      : statusRaw === "fulfilled"
        ? "fulfilled"
        : statusRaw === "confirmed" || statusRaw === "completed"
          ? "confirmed"
          : "pending";
  const metadata = raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const razorpay = (metadata as Record<string, any>).razorpay && typeof (metadata as Record<string, any>).razorpay === "object"
    ? (metadata as Record<string, any>).razorpay
    : null;
  const paymentStatus = String(razorpay?.status ?? "authorized").toLowerCase();

  return {
    id: String(raw?.id ?? ""),
    cartId: String(raw?.cart_id ?? cartIdFallback ?? ""),
    customerId: raw?.customer_id ? String(raw.customer_id) : undefined,
    status,
    currencyCode: String(raw?.currency_code ?? "usd").toLowerCase() === "inr" ? "inr" : "usd",
    items: Array.isArray(raw?.items) ? raw.items.map(mapOrderItem) : [],
    totalInCents: Math.max(0, Math.round(toNumber(raw?.total, 0))),
    payment: razorpay?.order_id || razorpay?.payment_id ? {
      id: String(razorpay?.payment_id ?? ""),
      orderId: String(raw?.id ?? ""),
      provider: "razorpay",
      amountInCents: Math.max(0, Math.round(toNumber(razorpay?.amount, raw?.total ?? 0))),
      status: paymentStatus === "captured" ? "captured" : paymentStatus === "failed" ? "failed" : "authorized",
      providerReference: String(razorpay?.order_id ?? ""),
      providerOrderId: String(razorpay?.order_id ?? ""),
      providerPaymentId: String(razorpay?.payment_id ?? "")
    } : undefined,
    createdAt: raw?.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()
  };
};


