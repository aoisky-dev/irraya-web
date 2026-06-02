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
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published";
  image?: string;
  variants: ProductVariant[];
  metadata?: Record<string, string>;
  rating?: number;
  reviewsCount?: number;
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
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: "mock" | "stripe";
  amountInCents: number;
  status: "requires_action" | "authorized" | "captured" | "failed";
  providerReference: string;
}
