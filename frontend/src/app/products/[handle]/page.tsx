import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getProductByHandle } from "@/lib/api/products";

interface ProductDetailPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps): Promise<JSX.Element> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const variant = product.variants[0];

  return (
    <section>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      {variant ? (
        <p>{formatMoney(variant.priceInCents, "usd")}</p>
      ) : (
        <p className="muted">No variants available</p>
      )}
      <Link href="/cart" className="btn">
        Go to cart
      </Link>
    </section>
  );
}

