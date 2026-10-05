import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProductByHandle, getProductById } from "@/lib/api/products";
import { ReviewFormClient } from "@/components/ReviewFormClient";

type ProductReviewPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: ProductReviewPageProps): Promise<Metadata> {
  const { handle } = await params;
  let product = await getProductByHandle(handle).catch(() => null);
  
  if (!product && handle.startsWith("prod_")) {
    product = await getProductById(handle).catch(() => null);
  }

  if (!product) {
    return {
      title: "Product not found | Irraya Fashion",
      robots: { index: false, follow: false }
    };
  }

  return {
    title: `Write a Review for ${product.title} | Irraya Fashion`,
    description: `Leave a review for ${product.title}.`,
    robots: { index: false, follow: false }
  };
}

export default async function ProductReviewPage({ params }: ProductReviewPageProps) {
  const { handle } = await params;

  let product = await getProductByHandle(handle).catch(() => null);

  if (!product && handle.startsWith("prod_")) {
    product = await getProductById(handle).catch(() => null);
    if (product && product.handle) {
      redirect(`/products/${product.handle}/review`);
    }
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="container" style={{ padding: "var(--header-height) var(--space-md) var(--space-4xl)" }}>
      <ReviewFormClient product={product} />
    </main>
  );
}
