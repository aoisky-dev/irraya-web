import type { Metadata } from "next";
import { ProductCatalogClient } from "@/components/ProductCatalogClient";
import { categoryMetadata } from "@/lib/seo";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  return categoryMetadata(params.category);
}

export default function ProductsPage() {
  return <ProductCatalogClient />;
}
