import type { Product } from "../types";
import { medusaRequest } from "./client";

type CompareApiItem = {
  product_id?: unknown;
  product_snapshot?: unknown;
};

const toProduct = (item: CompareApiItem): Product | null => {
  const product = item.product_snapshot && typeof item.product_snapshot === "object" ? item.product_snapshot as Product : null;
  if (!product?.id && typeof item.product_id !== "string") return null;
  return {
    id: product?.id ?? String(item.product_id),
    handle: product?.handle ?? String(item.product_id),
    title: product?.title ?? "Compared product",
    description: product?.description ?? "",
    category: product?.category ?? "general",
    status: product?.status ?? "published",
    image: product?.image,
    rating: product?.rating,
    reviewsCount: product?.reviewsCount,
    variants: Array.isArray(product?.variants) ? product.variants : [],
    metadata: product?.metadata
  };
};

export async function getCompareList(token: string): Promise<Product[]> {
  const response = await medusaRequest<{ items?: CompareApiItem[] }>("/store/customers/me/compare", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return (response.items ?? []).map(toProduct).filter((product): product is Product => Boolean(product));
}

export async function syncCompareList(token: string, products: Product[]): Promise<Product[]> {
  const response = await medusaRequest<{ items?: CompareApiItem[] }>("/store/customers/me/compare", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      items: products.slice(0, 4).map((product) => ({
        product_id: product.id,
        product
      }))
    })
  });
  return (response.items ?? []).map(toProduct).filter((product): product is Product => Boolean(product));
}

export async function clearCompareList(token: string): Promise<void> {
  await medusaRequest<{ cleared?: boolean }>("/store/customers/me/compare", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
}

