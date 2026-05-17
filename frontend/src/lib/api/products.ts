import { sampleProducts } from "../mock-data";
import type { Product } from "../types";
import { apiRequest } from "./client";

export async function getProducts(): Promise<Product[]> {
  try {
    return await apiRequest<Product[]>("/products");
  } catch {
    // Temporary fallback until backend HTTP layer is wired.
    return sampleProducts;
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  try {
    return await apiRequest<Product>(`/products/${handle}`);
  } catch {
    return sampleProducts.find((product) => product.handle === handle) ?? null;
  }
}

