"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { formatMoney } from "@/lib/format";
import {
  createOrderFromCart,
  createRazorpayPaymentOrder,
  linkRazorpayPaymentToOrder,
  verifyRazorpayPayment,
  prepareCartForCheckout,
  type RazorpayPaymentOrder
} from "@/lib/api/checkout";
import { saveCustomerAddress } from "@/lib/api/auth";
import { config } from "@/lib/config";
import Link from "next/link";
import Image from "next/image";

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
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
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
    metadata?: { order_id?: string; payment_id?: string };
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
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(input: {
  paymentOrder: RazorpayPaymentOrder;
  cartId: string;
  customerName: string;
  customerEmail: string;
}): Promise<RazorpayCheckoutResponse> {
  if (!window.Razorpay) return Promise.reject(new Error("Razorpay not available."));
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
      prefill: { name: input.customerName, email: input.customerEmail },
      notes: { cart_id: input.cartId },
      theme: { color: "#7c3aed" },
      modal: {
        ondismiss: () => { if (!completed) reject(new Error("Payment was cancelled.")); }
      },
      handler: (response) => { completed = true; resolve(response); }
    });
    checkout.on?.("payment.failed", (response) => {
      completed = true;
      reject(new RazorpayCheckoutError(
        response.error?.description || response.error?.reason || "Payment failed.",
        response.error?.metadata?.order_id,
        response.error?.metadata?.payment_id
      ));
    });
    checkout.open();
  });
}

// Step indicator
function CheckoutSteps({ current }: { current: number }) {
  const steps = ["Cart", "Shipping", "Payment", "Confirmation"];
  return (
    <div className="checkout-steps">
      {steps.map((s, i) => (
        <div key={s} className={`checkout-step ${i < current ? "done" : i === current ? "active" : ""}`}>
          <div className="checkout-step-circle">
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : i + 1}
          </div>
          <span className="checkout-step-label">{s}</span>
          {i < steps.length - 1 && <div className="checkout-step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { cart, isLoading: isCartLoading, clearCart, itemMeta, applyPromo } = useCart();
  const { user, token, isLoading: isAuthLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [failureReference, setFailureReference] = useState<{ razorpayOrderId?: string; razorpayPaymentId?: string } | null>(null);
  const [recoverablePayment, setRecoverablePayment] = useState<RecoverablePayment | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    address: "", city: "", state: "", zipCode: "", country: "India"
  });

  useEffect(() => {
    if (user) {
      const defaultAddress = user.addresses?.[0];
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || defaultAddress?.first_name || "",
        lastName: prev.lastName || user.lastName || defaultAddress?.last_name || "",
        email: prev.email || user.email || "",
        address: prev.address || defaultAddress?.address_1 || "",
        city: prev.city || defaultAddress?.city || "",
        zipCode: prev.zipCode || defaultAddress?.postal_code || ""
      }));
    } else if (!isAuthLoading) {
      router.push("/login?next=/checkout&reason=checkout");
    }
  }, [user, isAuthLoading, router]);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isCartLoading || isAuthLoading || !user) {
    return (
      <div className="checkout-loading">
        <div className="checkout-loading-inner">
          <div className="spinner" />
          <p>Preparing your checkout…</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="checkout-empty-icon">🛍️</div>
        <h1>Your cart is empty</h1>
        <p>Add some items before checking out.</p>
        <Link href="/products" className="btn btn-lg">Browse Products</Link>
      </div>
    );
  }

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      await applyPromo(promoCode.trim());
    } catch {
      setPromoError("Invalid or expired promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const completePaidCart = async (payment: RecoverablePayment) => {
    const order = await createOrderFromCart(payment.cartId, token ?? undefined);
    try {
      await linkRazorpayPaymentToOrder({
        cartId: payment.cartId, orderId: order.id,
        amountInCents: payment.amountInCents, currencyCode: payment.currencyCode,
        razorpayOrderId: payment.razorpayOrderId, razorpayPaymentId: payment.razorpayPaymentId,
        status: "authorized", token: token ?? undefined
      });
    } catch (linkErr) {
      console.error("Payment link failed (non-fatal):", linkErr);
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
      setError(err?.message || "Order confirmation still failed. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
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
      await prepareCartForCheckout(cart.id, form, token ?? undefined);

      if (saveAddress && token) {
        try {
          const isDuplicate = user.addresses?.some(
            (a) => a.address_1 === form.address && a.city === form.city && a.postal_code === form.zipCode
          );
          if (!isDuplicate) {
            await saveCustomerAddress(token, {
              first_name: form.firstName, last_name: form.lastName,
              address_1: form.address, city: form.city,
              country_code: "in", postal_code: form.zipCode
            });
            await refreshUser();
          }
        } catch {
          // non-fatal — order still proceeds
        }
      }

      const paymentOrder = await createRazorpayPaymentOrder({
        cartId: cart.id, amountInCents: cart.totalInCents,
        currencyCode: cart.currencyCode, token: token ?? undefined,
        customer: { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email.trim() }
      });

      await loadRazorpayCheckout();
      const razorpayResponse = await openRazorpayCheckout({
        paymentOrder, cartId: cart.id,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email.trim()
      });

      setFailureReference({
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id
      });

      await verifyRazorpayPayment({
        cartId: cart.id, amountInCents: paymentOrder.amountInCents,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        token: token ?? undefined
      });

      verifiedPaymentForRecovery = {
        cartId: cart.id, amountInCents: paymentOrder.amountInCents,
        currencyCode: paymentOrder.currencyCode,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id
      };
      setRecoverablePayment(verifiedPaymentForRecovery);

      await completePaidCart(verifiedPaymentForRecovery);
    } catch (err: any) {
      if (verifiedPaymentForRecovery) {
        setRecoverablePayment(verifiedPaymentForRecovery);
        setError("Payment succeeded, but order confirmation failed. Please retry below or contact support with your reference.");
      } else if (err instanceof RazorpayCheckoutError) {
        setFailureReference({ razorpayOrderId: err.razorpayOrderId, razorpayPaymentId: err.razorpayPaymentId });
        setError(`${err.message} You can retry payment without changing your cart.`);
      } else if (err?.message?.includes("cancelled")) {
        setError(""); // Silent cancel
      } else {
        setError(err?.message || "Checkout failed. Please try again.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <Link href="/" className="checkout-logo">{config.storeName}</Link>
        <CheckoutSteps current={2} />
        <div className="checkout-secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Secure Checkout
        </div>
      </div>

      <div className="checkout-body">
        {/* Left column */}
        <div className="checkout-left">

          {/* Contact */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <span className="checkout-card-icon">👤</span>
              <h2>Contact Information</h2>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name <span className="required">*</span></label>
                <input id="firstName" className="form-input" type="text" placeholder="First Name"
                  value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name <span className="required">*</span></label>
                <input id="lastName" className="form-input" type="text" placeholder="Last Name"
                  value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label" htmlFor="email">Email Address <span className="required">*</span></label>
                <input id="email" className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                <p className="form-hint">Order confirmation and tracking will be sent here.</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <span className="checkout-card-icon">📍</span>
              <h2>Shipping Address</h2>
            </div>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label" htmlFor="address">Street Address <span className="required">*</span></label>
                <input id="address" className="form-input" type="text" placeholder="House no., street, locality"
                  value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="city">City <span className="required">*</span></label>
                <input id="city" className="form-input" type="text" placeholder="Hyderabad"
                  value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="state">State</label>
                <select id="state" className="form-input" value={form.state} onChange={(e) => updateField("state", e.target.value)}>
                  <option value="">Select State</option>
                  {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="zipCode">PIN Code <span className="required">*</span></label>
                <input id="zipCode" className="form-input" type="text" placeholder="500001" maxLength={6}
                  value={form.zipCode} onChange={(e) => updateField("zipCode", e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="country">Country</label>
                <input id="country" className="form-input" type="text" value={form.country} readOnly
                  style={{ opacity: 0.7, cursor: "not-allowed" }} />
              </div>
              <div className="form-group full">
                <label className="checkout-save-label">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  <span>Save address</span>
                </label>
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <span className="checkout-card-icon">🚚</span>
              <h2>Shipping Method</h2>
            </div>
            <div className="shipping-option-card active">
              <div className="shipping-option-left">
                <div className="shipping-option-radio" />
                <div>
                  <p className="shipping-option-name">Standard Shipping</p>
                  <p className="shipping-option-meta">Estimated delivery: 5–7 business days</p>
                </div>
              </div>
              <span className="shipping-option-price">FREE</span>
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <span className="checkout-card-icon">💳</span>
              <h2>Payment Method</h2>
            </div>
            <div className="payment-methods-grid">
              {[
                { icon: "📱", label: "UPI" },
                { icon: "💳", label: "Cards" },
                { icon: "🏦", label: "Net Banking" },
                { icon: "👛", label: "Wallets" },
              ].map((m) => (
                <div key={m.label} className="payment-method-chip">
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
            <div className="payment-razorpay-info">
              <div className="payment-razorpay-logo">
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z" fill="#2D6BE4"/><path d="M16 28l8-16-4 8h6l-10 8z" fill="#fff"/></svg>
                Powered by <strong>Razorpay</strong>
              </div>
              <p>You'll be securely redirected to complete payment. We never store your card details.</p>
            </div>
          </div>

        </div>

        {/* Right column — Order Summary */}
        <div className="checkout-right">
          <div className="checkout-summary-card">
            <h2 className="checkout-summary-title">
              Order Summary
              <span className="checkout-summary-count">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </h2>

            {/* Items */}
            <div className="checkout-summary-items">
              {cart.items.map((item) => {
                const meta = itemMeta.get(item.variantId);
                return (
                  <div key={item.id} className="checkout-summary-item">
                    <div className="checkout-summary-item-img">
                      {meta?.image ? (
                        <Image src={meta.image} alt={meta?.title || "Product"} width={56} height={56} style={{ objectFit: "cover", borderRadius: "6px" }} />
                      ) : (
                        <div className="checkout-summary-item-placeholder">
                          {(meta?.title || "P").charAt(0)}
                        </div>
                      )}
                      <span className="checkout-summary-item-qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-summary-item-info">
                      <p className="checkout-summary-item-title">{meta?.title || "Product"}</p>
                      {(meta?.size || meta?.color) && (
                        <p className="checkout-summary-item-variant">
                          {[meta?.size, meta?.color].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="checkout-summary-item-price">
                      {formatMoney(item.unitPriceInCents * item.quantity, cart.currencyCode)}
                    </span>
                  </div>
                );
              })}
            </div>

            <hr className="checkout-divider" />

            {/* Promo */}
            <form onSubmit={handleApplyPromo} className="checkout-promo-form">
              <input type="text" className="form-input" placeholder="Gift card or promo code"
                value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <button type="submit" className="btn btn-secondary" disabled={promoLoading}>
                {promoLoading ? "…" : "Apply"}
              </button>
            </form>
            {promoError && <p className="checkout-promo-error">{promoError}</p>}
            {cart.promoCode && <p className="checkout-promo-success">✓ Code <strong>{cart.promoCode}</strong> applied</p>}

            <hr className="checkout-divider" />

            {/* Totals */}
            <div className="checkout-totals">
              <div className="checkout-total-row">
                <span>Subtotal</span>
                <span>{formatMoney(cart.subtotalInCents, "inr")}</span>
              </div>
              {cart.discountInCents ? (
                <div className="checkout-total-row checkout-total-discount">
                  <span>Discount</span>
                  <span>−{formatMoney(cart.discountInCents, "inr")}</span>
                </div>
              ) : null}
              <div className="checkout-total-row">
                <span>Shipping</span>
                <span className="checkout-total-free">Free</span>
              </div>
              <div className="checkout-total-row">
                <span>Taxes (GST incl.)</span>
                <span>{cart.taxInCents ? formatMoney(cart.taxInCents, "inr") : "Included"}</span>
              </div>
            </div>

            <hr className="checkout-divider" />

            <div className="checkout-grand-total">
              <span>Total</span>
              <span>{formatMoney(cart.totalInCents, "inr")}</span>
            </div>

            {error && (
              <div className="checkout-alert checkout-alert-error">
                <div className="checkout-alert-icon">⚠️</div>
                <div className="checkout-alert-body">
                  <p className="checkout-alert-title">
                    {recoverablePayment ? "Payment received – confirmation pending" : "Something went wrong"}
                  </p>
                  <p className="checkout-alert-message">{error}</p>
                  {(failureReference?.razorpayPaymentId || failureReference?.razorpayOrderId) && (
                    <p className="checkout-alert-ref">
                      Reference: <code>{failureReference.razorpayPaymentId || failureReference.razorpayOrderId}</code>
                    </p>
                  )}
                  {recoverablePayment && (
                    <button className="btn btn-sm" onClick={handleRetryOrderConfirmation} disabled={isSubmitting}
                      style={{ marginTop: "12px" }}>
                      {isSubmitting ? "Retrying…" : "Retry Order Confirmation"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button className="btn btn-full btn-lg checkout-pay-btn"
              onClick={handlePlaceOrder} disabled={isSubmitting} id="pay-now-btn">
              {isSubmitting ? (
                <span className="checkout-pay-loading">
                  <span className="spinner-sm" />
                  Processing…
                </span>
              ) : (
                <span>Pay {formatMoney(cart.totalInCents, "inr")}</span>
              )}
            </button>

            <div className="checkout-trust-badges">
              <span>🔒 SSL Secured</span>
              <span>↩ 7-Day Exchanges</span>
              <span>✓ Razorpay Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
