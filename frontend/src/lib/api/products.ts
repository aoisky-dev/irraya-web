import { sampleProducts } from "../mock-data";
import type { Product } from "../types";
import { apiRequest } from "./client";

export async function getProducts(params?: Record<string, string | number>): Promise<Product[]> {
  try {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return await apiRequest<Product[]>(`/products${qs}`);
  } catch {
    // Temporary fallback until backend HTTP layer is wired.
    if (params && params.q) {
      const q = (params.q as string).toLowerCase();
      return sampleProducts.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
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

