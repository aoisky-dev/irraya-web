interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({
  params
}: OrderConfirmationPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return (
    <section>
      <h1>Order Confirmation</h1>
      <p>Thank you for your purchase.</p>
      <p>
        Order ID: <strong>{id}</strong>
      </p>
    </section>
  );
}

