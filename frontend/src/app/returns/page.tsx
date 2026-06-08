export default function ReturnsPage() {
  return (
    <div className="container" style={{ padding: "var(--space-2xl) 0", maxWidth: "800px" }}>
      <h1 className="section-title" style={{ fontSize: "2.5rem", marginBottom: "var(--space-xl)" }}>Generous Return Policy</h1>
      
      <div className="prose" style={{ lineHeight: 1.8 }}>
        <p>At Irraya, we want you to be completely satisfied with your purchase. If for any reason you are not, we offer a generous and hassle-free return policy.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>30-Day Returns</h2>
        <p>You have 30 days from the date of delivery to return your items. We accept returns on all unworn, unwashed, and undamaged items with original tags attached.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>Free Return Shipping</h2>
        <p>We provide free prepaid return labels for all domestic orders. Simply log into your account, select the items you wish to return, and print your label.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>Instant Refunds</h2>
        <p>Once your return is dropped off at the carrier, we issue an instant refund to your original payment method. Please allow 3-5 business days for your bank to process the funds.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>Exchanges</h2>
        <p>Need a different size or color? You can easily exchange items through our return portal. Your replacement will be shipped out as soon as you drop off the original item.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>Exceptions</h2>
        <p>Final sale items, intimate apparel, and customized products are not eligible for return or exchange.</p>
      </div>
    </div>
  );
}
