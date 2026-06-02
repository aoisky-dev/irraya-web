 export type ProductStatus = "draft" | "published";

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
  status: ProductStatus;
  image?: string;
  variants: ProductVariant[];
  metadata?: Record<string, string>;
  rating?: number;
  reviewsCount?: number;
}

