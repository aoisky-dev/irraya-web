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
      ) * 100
    ),
    stock: typeof raw?.inventory_quantity !== "undefined" ? Math.max(0, Math.round(toNumber(raw?.inventory_quantity, 0))) : 100
  };
};

export const mapMedusaProduct = (raw: any): Product => {
  const id = normalizeText(raw?.id, `prod_${Date.now()}`);
  const variantsRaw = Array.isArray(raw?.variants) ? raw.variants : [];
  const variants =
    variantsRaw.length > 0 ? variantsRaw.map((v: unknown) => mapVariant(v, id)) : [mapVariant({}, id)];
  const metadata = raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const metadataRecord = Object.fromEntries(
    Object.entries(metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
  );
  const rating = toNumber((metadata as Record<string, unknown>).rating, 0);
  const reviewsCount = toNumber((metadata as Record<string, unknown>).reviews_count ?? (metadata as Record<string, unknown>).reviewsCount, 0);

  const imagesRaw = Array.isArray(raw?.images) ? raw.images : [];
  const images = imagesRaw.map((img: any) => normalizeText(img?.url, "")).filter(Boolean);

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
    images: images.length > 0 ? images : undefined,
    rating: rating > 0 ? rating : undefined,
    reviewsCount: reviewsCount > 0 ? Math.round(reviewsCount) : undefined,
    variants,
    metadata: metadataRecord,
    tags: Array.isArray(raw?.tags) ? raw.tags.map((tag: any) => normalizeText(tag?.value ?? tag?.name ?? tag, "")).filter(Boolean) : undefined,
    metaTitle: normalizeText((metadata as Record<string, unknown>).metaTitle ?? (metadata as Record<string, unknown>).meta_title, "") || undefined,
    metaDescription: normalizeText((metadata as Record<string, unknown>).metaDescription ?? (metadata as Record<string, unknown>).meta_description, "") || undefined
  };
};

const mapCartItem = (raw: any): CartItem => ({
  id: String(raw?.id ?? ""),
  productId: String(raw?.product_id ?? raw?.product?.id ?? ""),
  variantId: String(raw?.variant_id ?? raw?.variant?.id ?? ""),
  quantity: Math.max(0, Math.round(toNumber(raw?.quantity, 0))),
  unitPriceInCents: Math.max(
    0,
    Math.round(toNumber(raw?.unit_price ?? raw?.total / Math.max(toNumber(raw?.quantity, 1), 1), 0)) * 100
  )
});

export const mapMedusaCart = (raw: any): Cart => {
  const subtotalInCents = Math.max(0, Math.round(toNumber(raw?.subtotal ?? raw?.subtotal_incl_tax, 0))) * 100;
  const totalInCents = Math.max(0, Math.round(toNumber(raw?.total, subtotalInCents / 100))) * 100;

  return {
    id: String(raw?.id ?? ""),
    customerId: raw?.customer_id ? String(raw.customer_id) : undefined,
    currencyCode: String(raw?.currency_code ?? "usd").toLowerCase() === "inr" ? "inr" : "usd",
    items: Array.isArray(raw?.items) ? raw.items.map(mapCartItem) : [],
    promoCode: Array.isArray(raw?.promotions) ? raw.promotions[0]?.code : undefined,
    discountInCents: Math.max(0, Math.round(toNumber(raw?.discount_total, Math.max((subtotalInCents - totalInCents) / 100, 0)))) * 100,
    subtotalInCents,
    totalInCents
  };
};

const mapOrderItem = (raw: any): OrderItem => {
  const variantOptions = (raw?.variant?.options ?? raw?.variant?.option_values ?? []) as Array<any>;
  const optionValue = (title: string): string | undefined => {
    const match = variantOptions.find((value) => String(value.option?.title ?? value.option_title ?? "").toLowerCase() === title);
    return match?.value ? String(match.value) : undefined;
  };

  return {
    id: String(raw?.id ?? ""),
    productId: String(raw?.product_id ?? raw?.product?.id ?? ""),
    variantId: String(raw?.variant_id ?? raw?.variant?.id ?? ""),
    quantity: Math.max(0, Math.round(toNumber(raw?.quantity, 0))),
    unitPriceInCents: Math.max(0, Math.round(toNumber(raw?.unit_price ?? raw?.subtotal, 0))) * 100,
    title: normalizeText(raw?.title ?? raw?.product_title ?? raw?.product?.title, "Product"),
    image: normalizeText(raw?.thumbnail ?? raw?.product?.thumbnail ?? raw?.variant?.product?.thumbnail, "") || undefined,
    size: optionValue("size"),
    color: optionValue("color")
  };
};

const getOrderEligibility = (raw: any) => {
  const status = String(raw?.status ?? "").toLowerCase();
  const fulfillmentStatus = String(raw?.fulfillment_status ?? raw?.fulfillment_statuses?.[0] ?? "").toLowerCase();
  const createdAt = raw?.created_at ? new Date(raw.created_at) : null;
  const returnWindowEndsAt = createdAt && Number.isFinite(createdAt.getTime())
    ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const cancelled = status === "canceled" || status === "cancelled";
  const fulfilled = status === "fulfilled" || ["fulfilled", "shipped", "delivered"].includes(fulfillmentStatus);
  const inReturnWindow = returnWindowEndsAt ? Date.now() <= new Date(returnWindowEndsAt).getTime() : false;

  return {
    canCancel: !cancelled && !fulfilled,
    canReturn: !cancelled && inReturnWindow,
    canExchange: !cancelled && inReturnWindow,
    returnWindowEndsAt
  };
};

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
  const shipment = (metadata as Record<string, any>).shipment && typeof (metadata as Record<string, any>).shipment === "object"
    ? (metadata as Record<string, any>).shipment
    : {};
  const paymentStatus = String(razorpay?.status ?? "authorized").toLowerCase();

  return {
    id: String(raw?.id ?? ""),
    cartId: String(raw?.cart_id ?? cartIdFallback ?? ""),
    customerId: raw?.customer_id ? String(raw.customer_id) : undefined,
    status,
    currencyCode: String(raw?.currency_code ?? "usd").toLowerCase() === "inr" ? "inr" : "usd",
    items: Array.isArray(raw?.items) ? raw.items.map(mapOrderItem) : [],
    totalInCents: Math.max(0, Math.round(toNumber(raw?.total, 0))) * 100,
    payment: razorpay?.order_id || razorpay?.payment_id ? {
      id: String(razorpay?.payment_id ?? ""),
      orderId: String(raw?.id ?? ""),
      provider: "razorpay",
      amountInCents: Math.max(0, Math.round(toNumber(razorpay?.amount, raw?.total ?? 0))) * 100,
      status: paymentStatus === "captured" ? "captured" : paymentStatus === "failed" ? "failed" : "authorized",
      providerReference: String(razorpay?.order_id ?? ""),
      providerOrderId: String(razorpay?.order_id ?? ""),
      providerPaymentId: String(razorpay?.payment_id ?? "")
    } : undefined,
    tracking: shipment.tracking_number || shipment.tracking_url || shipment.carrier || shipment.status ? {
      carrier: normalizeText(shipment.carrier, "") || undefined,
      trackingNumber: normalizeText(shipment.tracking_number, "") || undefined,
      trackingUrl: normalizeText(shipment.tracking_url, "") || undefined,
      status: ["processing", "shipped", "out_for_delivery", "delivered"].includes(String(shipment.status)) ? shipment.status : undefined,
      estimatedDelivery: normalizeText(shipment.estimated_delivery, "") || undefined
    } : undefined,
    eligibility: getOrderEligibility(raw),
    createdAt: raw?.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()
  };
};


