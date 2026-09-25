import type { Product } from "../types";
import { medusaRequest } from "./client";
import { mapMedusaProduct } from "./medusa-mappers";

// NOTE: Medusa's `fields` query param REPLACES the default field selection
// entirely once any plain (non-"*") field is present. Using a bare
// "material" here previously wiped out default scalar fields like title,
// handle, thumbnail, description, and status — causing every product to
// render as "Untitled Product" and listing links to fall back to raw
// product IDs (which then 404 on the detail page's handle lookup).
// Prefixing with "+" tells Medusa to ADD the field to the defaults instead
// of replacing them.
const defaultProductFields = "+material,*metadata,*categories,*tags,*images,*variants.prices,*variants.options";

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

