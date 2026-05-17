export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceInCents: number;
  stock: number;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published";
  variants: ProductVariant[];
  metadata?: Record<string, string>;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface Cart {
  id: string;
  customerId?: string;
  currencyCode: "usd" | "inr";
  items: CartItem[];
  subtotalInCents: number;
  totalInCents: number;
}

export interface Order {
  id: string;
  cartId: string;
  customerId?: string;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  currencyCode: "usd" | "inr";
  totalInCents: number;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: "mock" | "stripe";
  amountInCents: number;
  status: "requires_action" | "authorized" | "captured" | "failed";
  providerReference: string;
}

