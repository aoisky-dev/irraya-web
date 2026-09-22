import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { getProductByHandle, getProducts } from "@/lib/api/products";
import { breadcrumbJsonLd, productJsonLd, productMetadata } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle).catch(() => null);

  if (!product) {
    return {
      title: "Product not found | Irraya Fashion",
      robots: { index: false, follow: false }
    };
  }

  return productMetadata(product);
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params;

  // Both fetches happen on the server — no CORS issues, no client-side loading states
  const [product, allProducts] = await Promise.all([
    getProductByHandle(handle).catch(() => null),
    getProducts().catch(() => [])
  ]);

  if (!product) {
    notFound();
  }

  // Related = same category, different product
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
    { label: product.title }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
