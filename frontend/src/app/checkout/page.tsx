"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import { createOrderFromCart, authorizeOrderPayment } from "@/lib/api/checkout";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, isLoading, clearCart, itemMeta, applyPromo } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "applepay">("card");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: ""
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading checkout...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <h1>Nothing to checkout</h1>
        <p>Your cart is empty. Add some items first.</p>
        <Link href="/products" className="btn">Browse Products</Link>
      </div>
    );
  }

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    try {
      await applyPromo(promoCode);
    } catch (err: any) {
      setPromoError("Invalid or expired promo code");
    }
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city || !form.zipCode) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Create order from cart
      const order = await createOrderFromCart(cart.id);

      // 2. Authorize payment
      await authorizeOrderPayment(order.id, order.totalInCents);

      // 3. Clear cart and redirect
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err: any) {
      setError("Checkout failed. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h1 className="page-title">Checkout</h1>
      <p className="page-subtitle">Complete your order</p>

      <div className="checkout-layout">
        {/* Checkout Form */}
        <div>
          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  className="form-input"
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  className="form-input"
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
              <div className="form-group full">
                <label className="form-label" htmlFor="email">Email *</label>
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="form-group full">
                <label className="form-label" htmlFor="address">Street Address *</label>
                <input
                  id="address"
                  className="form-input"
                  type="text"
                  placeholder="123 Main Street"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="city">City *</label>
                <input
                  id="city"
                  className="form-input"
                  type="text"
                  placeholder="New York"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="state">State</label>
                <input
                  id="state"
                  className="form-input"
                  type="text"
                  placeholder="NY"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="zipCode">ZIP Code *</label>
                <input
                  id="zipCode"
                  className="form-input"
                  type="text"
                  placeholder="10001"
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="country">Country</label>
                <input
                  id="country"
                  className="form-input"
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="checkout-section">
            <h2>Shipping Method</h2>
            <div className="shipping-options">
              <label className="shipping-option active">
                <input type="radio" name="shipping" defaultChecked />
                <div>
                  <span className="shipping-option-title">Standard Shipping</span>
                  <span className="shipping-option-desc">5–7 business days</span>
                </div>
                <span className="text-accent" style={{ fontWeight: 600 }}>Free</span>
              </label>
              <label className="shipping-option">
                <input type="radio" name="shipping" />
                <div>
                  <span className="shipping-option-title">Express Shipping</span>
                  <span className="shipping-option-desc">2–3 business days</span>
                </div>
                <span style={{ fontWeight: 600 }}>₹500</span>
              </label>
            </div>
          </div>

          {/* Payment Section */}
          <div className="checkout-section">
            <h2>Payment Method</h2>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "var(--space-lg)" }}>
              <button 
                type="button"
                className={`btn ${paymentMethod === "card" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setPaymentMethod("card")}
                style={{ flex: 1 }}
              >
                Credit Card
              </button>
              <button 
                type="button"
                className={`btn ${paymentMethod === "paypal" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setPaymentMethod("paypal")}
                style={{ flex: 1 }}
              >
                PayPal
              </button>
              <button 
                type="button"
                className={`btn ${paymentMethod === "applepay" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setPaymentMethod("applepay")}
                style={{ flex: 1 }}
              >
                Apple Pay
              </button>
            </div>

            {paymentMethod === "card" && (
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label" htmlFor="cardNumber">Card Number (Stripe Mock)</label>
                  <input
                    id="cardNumber"
                    className="form-input"
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={form.cardNumber}
                    onChange={(e) => updateField("cardNumber", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cardExpiry">Expiry Date</label>
                  <input
                    id="cardExpiry"
                    className="form-input"
                    type="text"
                    placeholder="MM / YY"
                    value={form.cardExpiry}
                    onChange={(e) => updateField("cardExpiry", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cardCvc">CVC</label>
                  <input
                    id="cardCvc"
                    className="form-input"
                    type="text"
                    placeholder="123"
                    value={form.cardCvc}
                    onChange={(e) => updateField("cardCvc", e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div style={{ padding: "var(--space-xl)", textAlign: "center", background: "var(--bg-input)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "var(--space-sm)", color: "var(--accent)" }}>
                  <strong>PayPal</strong>
                </div>
                <p className="text-secondary">You will be redirected to PayPal to complete your purchase securely.</p>
              </div>
            )}

            {paymentMethod === "applepay" && (
              <div style={{ padding: "var(--space-xl)", textAlign: "center", background: "var(--text-primary)", color: "var(--text-inverse)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-sm)" }}>
                  <strong> Pay</strong>
                </div>
                <p style={{ color: "rgba(255, 255, 255, 0.8)" }}>Authenticate with Touch ID or Face ID on your Apple device.</p>
              </div>
            )}

            <p className="text-secondary" style={{ fontSize: "0.8rem", lineHeight: 1.6, marginTop: "var(--space-md)" }}>
              🔒 This is a demo. No real payment will be charged. Clicking "Place Order" simulates a
              successful payment via {paymentMethod}.
            </p>
          </div>

          {error && (
            <p style={{ color: "var(--error)", marginBottom: "var(--space-md)", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>
          {cart.items.map((item) => {
            const meta = itemMeta.get(item.variantId);
            return (
              <div key={item.id} className="summary-row" style={{ alignItems: "flex-start", gap: "var(--space-sm)" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.85rem", display: "block" }}>
                    {meta?.title || "Product"} × {item.quantity}
                  </span>
                  {(meta?.size || meta?.color) && (
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {meta?.size} {meta?.color && `· ${meta.color}`}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                  {formatMoney(item.unitPriceInCents * item.quantity, cart.currencyCode)}
                </span>
              </div>
            );
          })}
              <hr className="divider" />
              
              <form onSubmit={handleApplyPromo} style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
                <input 
                  type="text" 
                  placeholder="Promo code (e.g., WELCOME10)" 
                  className="input" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  style={{ flex: 1, padding: "8px" }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "8px 16px" }}>Apply</button>
              </form>
              {promoError && <p style={{ color: "var(--error)", fontSize: "0.85rem", marginTop: "-8px", marginBottom: "16px" }}>{promoError}</p>}
              {cart.promoCode && <p style={{ color: "var(--success, green)", fontSize: "0.85rem", marginTop: "-8px", marginBottom: "16px" }}>Applied code: {cart.promoCode}</p>}

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(cart.subtotalInCents, "inr")}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              {cart.discountInCents ? (
                <div className="summary-row" style={{ color: "var(--success, green)" }}>
                  <span>Discount</span>
                  <span>-{formatMoney(cart.discountInCents, "inr")}</span>
                </div>
              ) : null}
              <hr className="divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>{formatMoney(cart.totalInCents, "inr")}</span>
              </div>
          <button
            className="btn btn-full btn-lg mt-lg"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : `Place Order — ${formatMoney(cart.totalInCents, cart.currencyCode)}`}
          </button>
        </div>
      </div>
    </section>
  );
}
