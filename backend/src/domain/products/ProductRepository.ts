import type { Product } from "./Product.js";

export interface ProductRepository {
  findAllPublished(): Promise<Product[]>;
  findByHandle(handle: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

