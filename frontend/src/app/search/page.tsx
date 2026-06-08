import { getProducts } from "@/lib/api/products";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = (typeof resolvedParams.q === 'string' ? resolvedParams.q : "") || "";
  const products = await getProducts({ q: query });

  return (
    <div className="container" style={{ padding: "var(--space-2xl) 0" }}>
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="section-title" style={{ marginBottom: "var(--space-md)", fontSize: "2.5rem" }}>Search Results</h1>
        {query ? (
          <p style={{ color: "var(--text-secondary)" }}>Showing results for "{query}"</p>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>Showing all products</p>
        )}
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-2xl) 0" }}>
          <h2 className="section-title" style={{ marginBottom: "var(--space-md)" }}>No products found</h2>
          <p style={{ marginBottom: "var(--space-xl)" }}>We couldn't find anything matching your search.</p>
          <Link href="/products" className="btn btn-primary">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
