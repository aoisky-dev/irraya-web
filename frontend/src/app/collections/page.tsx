import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getProducts } from "@/lib/api/products";
import { breadcrumbJsonLd, categoryMetadata } from "@/lib/seo";

export const metadata: Metadata = categoryMetadata(); // Alternatively rename to collectionMetadata, but leaving as is to not break seo.ts

const formatCollectionLabel = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default async function CollectionsPage() {
  let collectionCards: Array<{ name: string; image?: string; count: number }> = [];
  let loadFailed = false;

  try {
    const products = await getProducts();
    const grouped = new Map<string, { image?: string; count: number }>();

    for (const product of products) {
      const collection = product.category?.trim(); // Assuming product.category is still populated by raw?.collection?.title
      if (!collection) continue;

      const existing = grouped.get(collection);
      if (existing) {
        existing.count += 1;
        if (!existing.image && product.image) existing.image = product.image;
      } else {
        grouped.set(collection, { image: product.image, count: 1 });
      }
    }

    collectionCards = [...grouped.entries()]
      .map(([name, meta]) => ({ name, image: meta.image, count: meta.count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    loadFailed = true;
  }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Collections" }])) }}
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      <h1 className="page-title">All Collections</h1>
      <p className="page-subtitle">Browse every collection and jump directly to filtered products.</p>

      {loadFailed ? (
        <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
          <h2>Could not load collections</h2>
          <p>Please try again in a moment.</p>
          <Link href="/products" className="btn">
            View Products
          </Link>
        </div>
      ) : collectionCards.length === 0 ? (
        <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
          <h2>No collections found</h2>
          <p>Add products in Medusa to populate collections.</p>
          <Link href="/products" className="btn">
            View Products
          </Link>
        </div>
      ) : (
        <div className="collections-grid" style={{ marginTop: "var(--space-xl)" }}>
          {collectionCards.map((collection) => (
            <Link
              key={collection.name}
              href={`/products?category=${encodeURIComponent(collection.name)}`}
              className="collection-card"
              style={{ position: "relative" }}
            >
              {collection.image && (
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="collection-card-overlay">
                <span className="collection-card-title">{formatCollectionLabel(collection.name)}</span>
                <span className="collection-card-count">{collection.count} items</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

