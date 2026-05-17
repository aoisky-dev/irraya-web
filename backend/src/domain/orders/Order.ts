export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";

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
  status: OrderStatus;
  currencyCode: "usd" | "inr";
  items: OrderItem[];
  totalInCents: number;
  createdAt: Date;
}

