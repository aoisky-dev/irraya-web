import type { Product } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaProduct } from "./medusa-mappers";

const defaultProductFields = "*metadata,*categories,*tags,*images,*variants.prices,*variants.options";

export async function getProducts(params?: Record<string, string | number>): Promise<Product[]> {
  const queryParams = new URLSearchParams({
    fields: defaultProductFields,
    ...(params as Record<string, string>)
  });
  const qs = `?${queryParams.toString()}`;
  const response = await medusaRequest<{ products?: unknown[] }>(`/store/products${qs}`);
  return (response.products ?? []).map(mapMedusaProduct);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const response = await medusaRequest<{ products?: unknown[] }>(
    `/store/products?${new URLSearchParams({ handle, limit: "1", fields: defaultProductFields }).toString()}`
  );
  const raw = (response.products ?? [])[0];
  return raw ? mapMedusaProduct(raw) : null;
}

export async function getCatalogFacetsSource(): Promise<Product[]> {
  return getProducts({ limit: 200 });
}

