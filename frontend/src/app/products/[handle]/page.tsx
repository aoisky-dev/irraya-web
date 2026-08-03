import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { getProductByHandle } from "@/lib/api/products";
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
  const product = await getProductByHandle(handle).catch(() => null);
  const breadcrumbItems = product
    ? [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/products" },
        { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
        { label: product.title }
      ]
    : [{ label: "Home", href: "/" }, { label: "Shop", href: "/products" }, { label: "Product" }];

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
        />
      )}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <ProductDetailClient handle={handle} />
    </>
  );
}
