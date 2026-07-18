"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import {
  createOrderFromCart,
  createRazorpayPaymentOrder,
  linkRazorpayPaymentToOrder,
  verifyRazorpayPayment,
  type RazorpayPaymentOrder
} from "@/lib/api/checkout";
import { config } from "@/lib/config";
import Link from "next/link";

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on?: (event: "payment.failed", handler: (response: RazorpayCheckoutFailureResponse) => void) => void;
};

type RazorpayCheckoutFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RecoverablePayment = {
  cartId: string;
  amountInCents: number;
  currencyCode: "usd" | "inr";
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

class RazorpayCheckoutError extends Error {
  constructor(
    message: string,
    readonly razorpayOrderId?: string,
    readonly razorpayPaymentId?: string
  ) {
    super(message);
    this.name = "RazorpayCheckoutError";
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const RAZORPAY_CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only run in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout. Please check your connection."));
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(input: {
  paymentOrder: RazorpayPaymentOrder;
  cartId: string;
  customerName: string;
  customerEmail: string;
}): Promise<RazorpayCheckoutResponse> {
  if (!window.Razorpay) {
    return Promise.reject(new Error("Razorpay Checkout is not available."));
  }

  const Razorpay = window.Razorpay;

  return new Promise((resolve, reject) => {
    let completed = false;
    const checkout = new Razorpay({
      key: input.paymentOrder.keyId,
      amount: input.paymentOrder.amountInCents,
      currency: input.paymentOrder.currencyCode.toUpperCase(),
      name: config.storeName,
      description: "Irraya order payment",
      order_id: input.paymentOrder.razorpayOrderId,
      prefill: {
        name: input.customerName,
        email: input.customerEmail
      },
      notes: {
        cart_id: input.cartId
      },
      theme: {
        color: "#111827"
      },
      modal: {
        ondismiss: () => {
          if (!completed) {
            reject(new Error("Payment was cancelled."));
          }
        }
      },
      handler: (response) => {
        completed = true;
        resolve(response);
      }
    });

    checkout.on?.("payment.failed", (response) => {
      completed = true;
      reject(new RazorpayCheckoutError(
        response.error?.description || response.error?.reason || "Razorpay payment failed.",
        response.error?.metadata?.order_id,
        response.error?.metadata?.payment_id
      ));
    });

    checkout.open();
  });
}

export default function CheckoutPage() {
  const { cart, isLoading, clearCart, itemMeta, applyPromo } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [failureReference, setFailureReference] = useState<{ razorpayOrderId?: string; razorpayPaymentId?: string } | null>(null);
  const [recoverablePayment, setRecoverablePayment] = useState<RecoverablePayment | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
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

  const completePaidCart = async (payment: RecoverablePayment) => {
    const order = await createOrderFromCart(payment.cartId);

    try {
      await linkRazorpayPaymentToOrder({
        cartId: payment.cartId,
        orderId: order.id,
        amountInCents: payment.amountInCents,
        currencyCode: payment.currencyCode,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        status: "authorized"
      });
    } catch (linkError) {
      console.error("Razorpay payment was authorized, but order metadata linking failed.", linkError);
    }

    clearCart();
    setRecoverablePayment(null);
    router.push(`/order/${order.id}`);
  };

  const handleRetryOrderConfirmation = async () => {
    if (!recoverablePayment) return;

    setIsSubmitting(true);
    setError("");

    try {
      await completePaidCart(recoverablePayment);
    } catch (err: any) {
      setError(err?.message || "Payment succeeded, but order confirmation still failed. Please contact support with the payment reference below.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
    setFailureReference(null);
    setRecoverablePayment(null);

    let verifiedPaymentForRecovery: RecoverablePayment | null = null;

    try {
      // 1. Create Razorpay order on the backend.
      const paymentOrder = await createRazorpayPaymentOrder({
        cartId: cart.id,
        amountInCents: cart.totalInCents,
        currencyCode: cart.currencyCode,
        customer: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim()
        }
      });

      // 2. Open Razorpay Checkout and collect the signed payment response.
      await loadRazorpayCheckout();
      const razorpayResponse = await openRazorpayCheckout({
        paymentOrder,
        cartId: cart.id,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email.trim()
      });

      setFailureReference({
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id
      });

      // 3. Verify the payment signature on the backend.
      await verifyRazorpayPayment({
        cartId: cart.id,
        amountInCents: paymentOrder.amountInCents,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      });

      verifiedPaymentForRecovery = {
        cartId: cart.id,
        amountInCents: paymentOrder.amountInCents,
        currencyCode: paymentOrder.currencyCode,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id
      };
      setRecoverablePayment(verifiedPaymentForRecovery);

      // 4. Complete the Medusa cart, link the payment reference, and redirect to confirmation.
      await completePaidCart(verifiedPaymentForRecovery);
    } catch (err: any) {
      if (verifiedPaymentForRecovery) {
        setRecoverablePayment(verifiedPaymentForRecovery);
        setError("Payment succeeded, but order confirmation failed. Please retry order confirmation below or contact support with the Razorpay reference.");
      } else if (err instanceof RazorpayCheckoutError) {
        setFailureReference({
          razorpayOrderId: err.razorpayOrderId,
          razorpayPaymentId: err.razorpayPaymentId
        });
        setError(`${err.message} You can retry payment without changing your cart.`);
      } else {
        setError(err?.message || "Checkout failed. Please try again.");
      }
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

            <div style={{ padding: "var(--space-xl)", textAlign: "center", background: "var(--bg-input)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "var(--space-sm)", color: "var(--accent)" }}>
                <strong>Razorpay</strong>
              </div>
              <p className="text-secondary">
                Pay securely with UPI, cards, net banking, wallets, or other Razorpay-supported methods.
              </p>
            </div>

            <p className="text-secondary" style={{ fontSize: "0.8rem", lineHeight: 1.6, marginTop: "var(--space-md)" }}>
              🔒 You will be redirected to Razorpay Checkout to complete payment securely.
            </p>
          </div>

          {error && (
            <div role="alert" style={{ color: "var(--error)", marginBottom: "var(--space-md)", fontSize: "0.9rem", lineHeight: 1.6, padding: "var(--space-md)", border: "1px solid var(--error)", borderRadius: "8px", background: "rgba(239, 68, 68, 0.08)" }}>
              <strong>Payment issue</strong>
              <p style={{ marginTop: "var(--space-xs)" }}>{error}</p>
              {(failureReference?.razorpayOrderId || failureReference?.razorpayPaymentId) && (
                <p style={{ marginTop: "var(--space-xs)", color: "var(--text-secondary)" }}>
                  Reference: {failureReference.razorpayPaymentId || failureReference.razorpayOrderId}
                </p>
              )}
              {recoverablePayment && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: "var(--space-sm)" }}
                  onClick={handleRetryOrderConfirmation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Retrying confirmation..." : "Retry order confirmation"}
                </button>
              )}
            </div>
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
            {isSubmitting ? "Processing..." : `Pay with Razorpay — ${formatMoney(cart.totalInCents, cart.currencyCode)}`}
          </button>
        </div>
      </div>
    </section>
  );
}
