export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceInCents: number;
  stock: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: "admin" | "customer";
  createdAt: string;
  addresses?: Array<{
    first_name?: string;
    last_name?: string;
    address_1?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  }>;
}

export type ProductStatus = "draft" | "published" | "archived";

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  text: string;
  imageUrls?: string[];
  status?: "pending" | "approved" | "rejected";
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  category: string;
  status: ProductStatus;
  image?: string;
  images?: string[];  // all uploaded product images
  videoUrl?: string;
  rating?: number;
  reviewsCount?: number;
  variants: ProductVariant[];
  metadata?: Record<string, string>;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPriceInCents: number;
  /** Client-enriched display fields (not from API) */
  title?: string;
  image?: string;
  size?: string;
  color?: string;
}

export interface Cart {
  id: string;
  customerId?: string;
  currencyCode: "usd" | "inr";
  items: CartItem[];
  promoCode?: string;
  discountInCents?: number;
  taxInCents?: number;
  subtotalInCents: number;
  totalInCents: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPriceInCents: number;
  title?: string;
  image?: string;
  size?: string;
  color?: string;
}

export interface ShipmentTracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: "processing" | "shipped" | "out_for_delivery" | "delivered";
  estimatedDelivery?: string;
}

export interface OrderEligibility {
  canCancel: boolean;
  canReturn: boolean;
  canExchange: boolean;
  returnWindowEndsAt?: string;
}

export type OrderRequestType = "cancel" | "exchange";
export type OrderRequestStatus = "requested" | "under_review" | "approved" | "rejected" | "refunded" | "completed";

export interface OrderRequestItem {
  itemId?: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
}

export interface OrderRequest {
  id: string;
  orderId: string;
  type: OrderRequestType;
  status: OrderRequestStatus;
  reason: string;
  notes?: string;
  items: OrderRequestItem[];
  trackingNumber?: string;
  trackingUrl?: string;
  refundReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface Order {
  id: string;
  displayId?: string;
  cartId: string;
  customerId?: string;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  currencyCode: "usd" | "inr";
  items: OrderItem[];
  subtotalInCents?: number;
  totalInCents: number;
  shippingAddress?: ShippingAddress;
  payment?: Payment;
  tracking?: ShipmentTracking;
  eligibility?: OrderEligibility;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: "mock" | "stripe" | "razorpay";
  amountInCents: number;
  status: "requires_action" | "authorized" | "captured" | "failed";
  providerReference: string;
  providerOrderId?: string;
  providerPaymentId?: string;
}
