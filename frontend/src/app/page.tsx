import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/api/products";

export default async function HomePage(): Promise<JSX.Element> {
  const products = await getProducts();

  return (
    <section>
      <div className="hero">
        <h1>Modern fashion for everyday style</h1>
        <p className="muted">Shop our latest collection with smooth checkout and fast delivery.</p>
        <Link href="/products" className="btn">
          Explore products
        </Link>
      </div>

      <h2>Featured products</h2>
      <div className="grid">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

