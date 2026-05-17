import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/api/products";

export default async function ProductsPage(): Promise<JSX.Element> {
  const products = await getProducts();

  return (
    <section>
      <h1>Products</h1>
      <p className="muted">Browse our catalog. Filters and sorting will be added in next steps.</p>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

