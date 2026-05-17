import Link from "next/link";
import { getCart } from "@/lib/api/cart";
import { formatMoney } from "@/lib/format";

export default async function CartPage(): Promise<JSX.Element> {
  const cart = await getCart("cart_demo_001");

  return (
    <section>
      <h1>Cart</h1>
      <p className="muted">Cart state is currently seeded; we will wire interactive updates next.</p>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            {item.productId} x {item.quantity} - {formatMoney(item.unitPriceInCents, cart.currencyCode)}
          </li>
        ))}
      </ul>
      <p>Total: {formatMoney(cart.totalInCents, cart.currencyCode)}</p>
      <Link href="/checkout" className="btn">
        Proceed to checkout
      </Link>
    </section>
  );
}

