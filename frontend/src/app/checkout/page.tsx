import Link from "next/link";

export default function CheckoutPage(): JSX.Element {
  return (
    <section>
      <h1>Checkout</h1>
      <p className="muted">
        This page will collect shipping address and payment details. For now, it acts as a workflow
        placeholder.
      </p>
      <Link href="/order/demo-order-id" className="btn">
        Simulate successful payment
      </Link>
    </section>
  );
}

