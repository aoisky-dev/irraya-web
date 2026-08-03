import type { Product } from "../types";
import { medusaRequest } from "./client";

type WishlistApiItem = {
  product_id?: unknown;
  product_snapshot?: unknown;
};

const toProduct = (item: WishlistApiItem): Product | null => {
  const product = item.product_snapshot && typeof item.product_snapshot === "object" ? item.product_snapshot as Product : null;
  if (!product?.id && typeof item.product_id !== "string") return null;
  return {
    id: product?.id ?? String(item.product_id),
    handle: product?.handle ?? String(item.product_id),
    title: product?.title ?? "Saved product",
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

export async function getWishlist(token: string): Promise<Product[]> {
  const response = await medusaRequest<{ items?: WishlistApiItem[] }>("/store/customers/me/wishlist", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return (response.items ?? []).map(toProduct).filter((product): product is Product => Boolean(product));
}

export async function addWishlistProduct(token: string, product: Product): Promise<Product> {
  const response = await medusaRequest<{ item?: WishlistApiItem }>("/store/customers/me/wishlist", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      product_id: product.id,
      product
    })
  });
  return toProduct(response.item ?? { product_id: product.id, product_snapshot: product }) ?? product;
}

export async function removeWishlistProduct(token: string, productId: string): Promise<void> {
  await medusaRequest<{ removed?: boolean }>("/store/customers/me/wishlist", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ product_id: productId })
  });
}

export async function migrateWishlistProducts(token: string, products: Product[]): Promise<Product[]> {
  for (const product of products) {
    await addWishlistProduct(token, product);
  }
  return getWishlist(token);
}

