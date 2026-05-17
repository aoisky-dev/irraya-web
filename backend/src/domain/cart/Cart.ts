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
  updatedAt: Date;
}

