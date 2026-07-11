import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getProducts } from "@/lib/api/products";

const formatCategoryLabel = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default async function CategoriesPage() {
  let categoryCards: Array<{ name: string; image?: string; count: number }> = [];
  let loadFailed = false;

  try {
    const products = await getProducts();
    const grouped = new Map<string, { image?: string; count: number }>();

    for (const product of products) {
      const category = product.category?.trim();
      if (!category) continue;

      const existing = grouped.get(category);
      if (existing) {
        existing.count += 1;
        if (!existing.image && product.image) existing.image = product.image;
      } else {
        grouped.set(category, { image: product.image, count: 1 });
      }
    }

    categoryCards = [...grouped.entries()]
      .map(([name, meta]) => ({ name, image: meta.image, count: meta.count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    loadFailed = true;
  }

  return (
    <section>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1 className="page-title">All Categories</h1>
      <p className="page-subtitle">Browse every category and jump directly to filtered products.</p>

      {loadFailed ? (
        <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
          <h2>Could not load categories</h2>
          <p>Please try again in a moment.</p>
          <Link href="/products" className="btn">
            View Products
          </Link>
        </div>
      ) : categoryCards.length === 0 ? (
        <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
          <h2>No categories found</h2>
          <p>Add products in Medusa to populate categories.</p>
          <Link href="/products" className="btn">
            View Products
          </Link>
        </div>
      ) : (
        <div className="collections-grid" style={{ marginTop: "var(--space-xl)" }}>
          {categoryCards.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="collection-card"
              style={{ position: "relative" }}
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="collection-card-overlay">
                <span className="collection-card-title">{formatCategoryLabel(category.name)}</span>
                <span className="collection-card-count">{category.count} items</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

