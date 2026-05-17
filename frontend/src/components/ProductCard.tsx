import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps): JSX.Element {
  const primaryVariant = product.variants[0];

  return (
    <article className="card">
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <p>
        {primaryVariant
          ? formatMoney(primaryVariant.priceInCents, "usd")
          : "Price unavailable"}
      </p>
      <Link href={`/products/${product.handle}`}>View details</Link>
    </article>
  );
}

