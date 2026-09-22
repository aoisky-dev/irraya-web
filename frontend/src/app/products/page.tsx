import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogClient } from "@/components/ProductCatalogClient";
import { getProducts } from "@/lib/api/products";
import { categoryMetadata } from "@/lib/seo";
import type { Product } from "@/lib/types";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  return categoryMetadata(params.category);
}

export default async function ProductsPage() {
  // Fetch products server-side so they appear on initial load (no loading spinner flash)
  let initialProducts: Product[] = [];
  try {
    initialProducts = await getProducts();
  } catch {
    // Client will retry on mount
  }

  return (
    <Suspense>
      <ProductCatalogClient initialProducts={initialProducts} />
    </Suspense>
  );
}
