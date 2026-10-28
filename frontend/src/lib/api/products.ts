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
// +*variants.calculated_price requests the pricing-context-aware price from Medusa
// (reflects active price lists). *variants.prices kept as fallback for the mapper.
const defaultProductFields = "+material,*metadata,*categories,*tags,*images,*variants.prices,*variants.options";

export async function getProducts(params?: Record<string, string | number>): Promise<Product[]> {
  const queryParams = new URLSearchParams({
    fields: defaultProductFields,
    ...(params as Record<string, string>)
  });
  const qs = `?${queryParams.toString()}`;
  const response = await medusaRequest<{ products?: unknown[] }>(`/store/products${qs}`, {
    next: { revalidate: 60 }
  });
  return (response.products ?? []).map(mapMedusaProduct);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const response = await medusaRequest<{ products?: unknown[] }>(
    `/store/products?${new URLSearchParams({ handle, limit: "1", fields: defaultProductFields }).toString()}`,
    { next: { revalidate: 60 } }
  );
  const raw = (response.products ?? [])[0];
  return raw ? mapMedusaProduct(raw) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const response = await medusaRequest<{ product?: unknown }>(
    `/store/products/${id}?${new URLSearchParams({ fields: defaultProductFields }).toString()}`,
    { next: { revalidate: 60 } }
  ).catch(() => null);
  return response?.product ? mapMedusaProduct(response.product) : null;
}

export async function getCatalogFacetsSource(): Promise<Product[]> {
  return getProducts({ limit: 200 });
}

export type StoreCollectionItem = {
  id: string;
  name: string;
  handle: string;
  href: string;
  count: number;
  image?: string;
  desc?: string;
};

let _cachedCollections: StoreCollectionItem[] | null = null;

export async function getStoreCollections(): Promise<StoreCollectionItem[]> {
  if (_cachedCollections && _cachedCollections.length > 0) {
    return _cachedCollections;
  }
  try {
    const colRes = await medusaRequest<{ collections?: Array<{ id: string; title: string; handle: string }> }>(
      "/store/collections?limit=50",
      { next: { revalidate: 60 } }
    ).catch(() => ({ collections: [] }));
    const storeCols = colRes.collections ?? [];

    const products = await getProducts({ limit: 100 }).catch(() => []);

    const grouped = new Map<string, { count: number; image?: string; material?: string }>();
    for (const p of products) {
      const colName = p.category?.trim();
      if (!colName) continue;
      const key = colName.toLowerCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.image && p.image) existing.image = p.image;
        if (!existing.material && p.material) existing.material = p.material.trim();
      } else {
        grouped.set(key, {
          count: 1,
          image: p.image,
          material: p.material ? p.material.trim() : undefined
        });
      }
    }

    if (storeCols.length > 0) {
      const items = storeCols.map((col) => {
        const meta = grouped.get(col.title.toLowerCase()) || grouped.get(col.handle.toLowerCase());
        const count = meta?.count ?? 0;
        return {
          id: col.id,
          name: col.title,
          handle: col.handle,
          href: `/products?category=${encodeURIComponent(col.title)}`,
          count,
          image: meta?.image,
          desc: meta?.material ? `${meta.material} · ${count} pieces` : `${count} pieces in this collection`
        };
      });
      _cachedCollections = items;
      return items;
    }

    // Fallback if /store/collections returns empty
    const fallbackCols: StoreCollectionItem[] = [];
    grouped.forEach((meta, name) => {
      fallbackCols.push({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        handle: name,
        href: `/products?category=${encodeURIComponent(name)}`,
        count: meta.count,
        image: meta.image,
        desc: meta.material ? `${meta.material} · ${meta.count} pieces` : `${meta.count} pieces`
      });
    });
    if (fallbackCols.length > 0) {
      _cachedCollections = fallbackCols;
    }
    return fallbackCols;
  } catch (error) {
    console.error("Failed to fetch store collections:", error);
    return [];
  }
}

