import type { Product } from "./Product.js";

export interface ProductFilter {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductRepository {
  findAllPublished(filter?: ProductFilter): Promise<Product[]>;
  findByHandle(handle: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

