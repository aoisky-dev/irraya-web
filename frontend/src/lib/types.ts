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
  videoUrl?: string;
  rating?: number;
  reviewsCount?: number;
  variants: ProductVariant[];
  metadata?: Record<string, string>;
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
  subtotalInCents: number;
  totalInCents: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface Order {
  id: string;
  cartId: string;
  customerId?: string;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  currencyCode: "usd" | "inr";
  items: OrderItem[];
  totalInCents: number;
  payment?: Payment;
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
