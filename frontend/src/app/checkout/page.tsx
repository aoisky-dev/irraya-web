"use client";

import { useState, useEffect, Suspense } from "react";
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
import {
  IconShoppingBag, IconUser, IconMapPin, IconTruck, IconCreditCard,
  IconSmartphone, IconBuilding, IconWallet, IconLock, IconCornerDownLeft,
  IconCheck, IconAlertTriangle, IconShield
} from "@/components/Icons";

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
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")));
      return;
    }
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
  customerPhone?: string;
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
      prefill: {
        name: input.customerName,
        email: input.customerEmail,
        ...(input.customerPhone ? { contact: input.customerPhone } : {})
      },
      notes: { cart_id: input.cartId },
      theme: { color: "#712119" }, // Brand burgundy
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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function normalizeIndianPhone(raw: string): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function matchState(inputState: string): string {
  if (!inputState) return "";
  const trimmed = inputState.trim();
  const lower = trimmed.toLowerCase();

  const abbrMap: Record<string, string> = {
    tg: "Telangana",
    ts: "Telangana",
    ap: "Andhra Pradesh",
    ka: "Karnataka",
    mh: "Maharashtra",
    dl: "Delhi",
    tn: "Tamil Nadu",
    kl: "Kerala",
    wb: "West Bengal",
    gj: "Gujarat",
    up: "Uttar Pradesh",
    mp: "Madhya Pradesh",
    rj: "Rajasthan"
  };
  if (abbrMap[lower]) return abbrMap[lower];

  const found = INDIAN_STATES.find((s) => s.toLowerCase() === lower);
  return found || trimmed;
}

// Interactive 3-Step Progress Indicator
function CheckoutSteps({
  currentStep,
  onStepClick
}: {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}) {
  const steps: { id: 1 | 2 | 3; label: string }[] = [
    { id: 1, label: "Shipping" },
    { id: 2, label: "Review" },
    { id: 3, label: "Payment" }
  ];

  return (
    <nav className="checkout-steps" aria-label="Checkout Progress">
      {steps.map((s, i) => {
        const isDone = s.id < currentStep;
        const isActive = s.id === currentStep;
        const isClickable = s.id < currentStep;

        return (
          <div
            key={s.id}
            className={`checkout-step ${isDone ? "done" : ""} ${isActive ? "active" : ""} ${isClickable ? "clickable" : ""}`}
            onClick={() => { if (isClickable) onStepClick(s.id); }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onStepClick(s.id);
              }
            }}
          >
            <div className="checkout-step-circle">
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                s.id
              )}
            </div>
            <span className="checkout-step-label">{s.label}</span>
            {i < steps.length - 1 && <div className="checkout-step-line" />}
          </div>
        );
      })}
    </nav>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { cart, isLoading: isCartLoading, clearCart, itemMeta, applyPromo, removePromo } = useCart();
  const { user, token, isLoading: isAuthLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Progressive 3-step state: 1: Shipping, 2: Review, 3: Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [failureReference, setFailureReference] = useState<{ razorpayOrderId?: string; razorpayPaymentId?: string } | null>(null);
  const [recoverablePayment, setRecoverablePayment] = useState<RecoverablePayment | null>(null);

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | "new">(0);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    country: "India"
  });

  // Inline validation tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Preload Razorpay Checkout script on component mount
  useEffect(() => {
    loadRazorpayCheckout().catch((err) => {
      console.warn("Preload Razorpay checkout script notice:", err);
    });
  }, []);

  useEffect(() => {
    if (user) {
      const addresses = user.addresses ?? [];
      const defaultAddress = addresses.length > 0 ? addresses[0] : null;
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || defaultAddress?.first_name || "",
        lastName: prev.lastName || user.lastName || defaultAddress?.last_name || "",
        email: prev.email || user.email || "",
        address: prev.address || defaultAddress?.address_1 || "",
        address2: prev.address2 || defaultAddress?.address_2 || "",
        city: prev.city || defaultAddress?.city || "",
        state: prev.state || matchState(defaultAddress?.province || ""),
        zipCode: prev.zipCode || (defaultAddress?.postal_code || "").replace(/\D/g, "").slice(0, 6),
        phone: prev.phone || normalizeIndianPhone(defaultAddress?.phone || (user as any).phone || "")
      }));

      if (addresses.length === 0) {
        setSelectedAddressIndex("new");
        setShowAddressForm(true);
      } else {
        // If default address is missing address_1, city, province, or postal_code, show form so user can complete it
        const isMissing = !defaultAddress?.address_1?.trim() || !defaultAddress?.city?.trim() || !defaultAddress?.province?.trim() || !defaultAddress?.postal_code?.trim();
        if (isMissing) {
          setShowAddressForm(true);
        }
      }
    } else if (!isAuthLoading) {
      router.push("/login?next=/checkout&reason=checkout");
    }
  }, [user, isAuthLoading, router]);

  const selectSavedAddress = (index: number) => {
    const addr = user?.addresses?.[index];
    if (!addr) return;
    setSelectedAddressIndex(index);
    setAddressDropdownOpen(false);

    // If the saved address is missing any key field, automatically reveal the form to complete it
    const isMissingDetails = !addr.address_1?.trim() || !addr.city?.trim() || !addr.province?.trim() || !addr.postal_code?.trim();
    setShowAddressForm(isMissingDetails);

    setForm((prev) => ({
      ...prev,
      firstName: addr.first_name || user?.firstName || prev.firstName || "",
      lastName: addr.last_name || user?.lastName || prev.lastName || "",
      address: addr.address_1 || "",
      address2: addr.address_2 || "",
      city: addr.city || "",
      state: matchState(addr.province || prev.state || ""),
      zipCode: (addr.postal_code || "").replace(/\D/g, "").slice(0, 6),
      phone: normalizeIndianPhone(addr.phone || prev.phone || "")
    }));
  };

  const selectNewAddress = () => {
    setSelectedAddressIndex("new");
    setShowAddressForm(true);
    setAddressDropdownOpen(false);
    setForm((prev) => ({
      ...prev,
      address: "",
      address2: "",
      city: "",
      state: "",
      zipCode: ""
    }));
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Field validation rules
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        return value.trim() ? "" : "First name is required";
      case "lastName":
        return value.trim() ? "" : "Last name is required";
      case "email": {
        const trimmed = value.trim();
        if (!trimmed) return "Email address is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return "Please enter a valid email address (e.g. name@example.com)";
        }
        return "";
      }
      case "phone": {
        const digits = normalizeIndianPhone(value);
        if (!digits) return "Mobile number is required";
        if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
          return "Enter a valid 10-digit Indian mobile number starting with 6–9";
        }
        return "";
      }
      case "address":
        return value.trim() ? "" : "Street address is required";
      case "city":
        return value.trim() ? "" : "City is required";
      case "state":
        return value.trim() ? "" : "Please select your state";
      case "zipCode": {
        const cleaned = value.replace(/\D/g, "");
        if (!cleaned) return "PIN code is required";
        if (cleaned.length !== 6) return "PIN code must be exactly 6 digits";
        return "";
      }
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateAllStep1 = (): boolean => {
    const requiredFields = [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email Address" },
      { key: "phone", label: "Mobile Number" },
      { key: "address", label: "Street Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zipCode", label: "PIN Code" }
    ];

    const newTouched: Record<string, boolean> = {};
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const { key, label } of requiredFields) {
      newTouched[key] = true;
      const rawVal = ((form as any)[key] || "").toString().trim();
      const err = validateField(key, (form as any)[key]);
      if (!rawVal) {
        missing.push(label);
      } else if (err) {
        invalid.push(`${label} (${err})`);
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));

    if (missing.length > 0) {
      setValidationError(`Please fill in: ${missing.join(", ")}`);
      // If any missing field is an address field and address form is hidden, expand it!
      const addressLabels = ["Street Address", "City", "State", "PIN Code"];
      if (missing.some((l) => addressLabels.includes(l))) {
        setShowAddressForm(true);
      }
      return false;
    }

    if (invalid.length > 0) {
      setValidationError(invalid[0]);
      const addressLabels = ["Street Address", "City", "State", "PIN Code"];
      if (invalid.some((inv) => addressLabels.some((l) => inv.startsWith(l)))) {
        setShowAddressForm(true);
      }
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleProceedToReview = () => {
    if (!validateAllStep1()) return;
    setValidationError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToPayment = () => {
    if (!validateAllStep1()) {
      setStep(1);
      return;
    }
    setValidationError("");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleRemovePromo = async () => {
    if (!cart?.promoCode) return;
    setPromoLoading(true);
    try {
      await removePromo(cart.promoCode);
      setPromoCode("");
    } catch {
      setPromoError("Failed to remove promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const completePaidCart = async (payment: RecoverablePayment) => {
    const order = await createOrderFromCart(payment.cartId, token ?? undefined);
    try {
      await linkRazorpayPaymentToOrder({
        cartId: payment.cartId,
        orderId: order.id,
        amountInCents: payment.amountInCents,
        currencyCode: payment.currencyCode,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        status: "authorized",
        token: token ?? undefined
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
    if (!validateAllStep1()) {
      setStep(1);
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    setError("");
    setFailureReference(null);
    setRecoverablePayment(null);

    let verifiedPaymentForRecovery: RecoverablePayment | null = null;

    try {
      await prepareCartForCheckout(cart!.id, {
        ...form,
        phone: normalizeIndianPhone(form.phone),
        state: form.state
      }, token ?? undefined);

      if (saveAddress && token) {
        try {
          const isDuplicate = user?.addresses?.some(
            (a) => a.address_1 === form.address && a.city === form.city && a.postal_code === form.zipCode
          );
          if (!isDuplicate) {
            await saveCustomerAddress(token, {
              first_name: form.firstName,
              last_name: form.lastName,
              address_1: form.address,
              address_2: form.address2,
              city: form.city,
              province: form.state,
              country_code: "in",
              postal_code: form.zipCode,
              phone: normalizeIndianPhone(form.phone) || undefined
            });
            await refreshUser();
          }
        } catch {
          // non-fatal — order still proceeds
        }
      }

      const paymentOrder = await createRazorpayPaymentOrder({
        cartId: cart!.id,
        amountInCents: cart!.totalInCents,
        currencyCode: cart!.currencyCode,
        token: token ?? undefined,
        customer: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim()
        }
      });

      await loadRazorpayCheckout();
      const razorpayResponse = await openRazorpayCheckout({
        paymentOrder,
        cartId: cart!.id,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email.trim(),
        customerPhone: normalizeIndianPhone(form.phone)
      });

      setFailureReference({
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id
      });

      await verifyRazorpayPayment({
        cartId: cart!.id,
        amountInCents: paymentOrder.amountInCents,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        token: token ?? undefined
      });

      verifiedPaymentForRecovery = {
        cartId: cart!.id,
        amountInCents: paymentOrder.amountInCents,
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
        <div className="checkout-empty-icon"><IconShoppingBag size={48} /></div>
        <h1>Your cart is empty</h1>
        <p>Add some items before checking out.</p>
        <Link href="/products" className="btn btn-lg">Browse Products</Link>
      </div>
    );
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  // Helper renderer for summary items
  const renderSummaryItems = () => (
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
            <div className="checkout-summary-item-price" style={{ textAlign: "right" }}>
              <div>{formatMoney(item.unitPriceInCents * item.quantity, cart.currencyCode)}</div>
              {item.compareAtUnitPriceInCents && item.compareAtUnitPriceInCents > item.unitPriceInCents && (
                <div style={{ textDecoration: "line-through", color: "var(--text-muted, #9ca3af)", fontSize: "0.85em" }}>
                  {formatMoney(item.compareAtUnitPriceInCents * item.quantity, cart.currencyCode)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Helper renderer for promo form
  const renderPromoForm = () => (
    <div>
      <form onSubmit={handleApplyPromo} className="checkout-promo-form">
        <input
          type="text"
          className="form-input"
          placeholder="Gift card or promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
        />
        <button type="submit" className="btn btn-secondary" disabled={promoLoading}>
          {promoLoading ? "…" : "Apply"}
        </button>
      </form>
      {promoError && <p className="checkout-promo-error">{promoError}</p>}
      {cart.promoCode && (
        <p className="checkout-promo-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span><IconCheck size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />Code <strong>{cart.promoCode}</strong> applied</span>
          <button type="button" onClick={handleRemovePromo} disabled={promoLoading} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}>
            Remove
          </button>
        </p>
      )}
    </div>
  );

  // Helper renderer for totals
  const renderTotals = () => {
    const originalSubtotal = cart.items.reduce((sum, item) => {
      const orig = item.compareAtUnitPriceInCents && item.compareAtUnitPriceInCents > item.unitPriceInCents
        ? item.compareAtUnitPriceInCents
        : item.unitPriceInCents;
      return sum + orig * item.quantity;
    }, 0);
    const saleSavings = cart.items.reduce((sum, item) =>
      item.compareAtUnitPriceInCents && item.compareAtUnitPriceInCents > item.unitPriceInCents
        ? sum + (item.compareAtUnitPriceInCents - item.unitPriceInCents) * item.quantity
        : sum, 0);
    const pct = originalSubtotal > 0 && saleSavings > 0
      ? Math.round((saleSavings / originalSubtotal) * 100)
      : 0;

    return (
      <>
        <div className="checkout-totals">
          <div className="checkout-total-row">
            <span>Subtotal</span>
            <span>{formatMoney(saleSavings > 0 ? originalSubtotal : cart.subtotalInCents, "inr")}</span>
          </div>
          {saleSavings > 0 && (
            <div className="checkout-total-row checkout-total-discount">
              <span>Sale discount {pct > 0 ? `(${pct}%)` : ""}</span>
              <span>−{formatMoney(saleSavings, "inr")}</span>
            </div>
          )}
          {cart.discountInCents ? (
            <div className="checkout-total-row checkout-total-discount">
              <span>Coupon discount{cart.promoCode ? ` (${cart.promoCode})` : ""}</span>
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
      </>
    );
  };

  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <div className="checkout-header-inner">
          <Link href="/" className="checkout-logo">{config.storeName}</Link>
          <CheckoutSteps currentStep={step} onStepClick={(s) => setStep(s)} />
          <div className="checkout-secure">
            <IconLock size={14} />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Mobile Collapsible Summary Bar */}
      <div className="checkout-mobile-summary-wrapper">
        <button
          type="button"
          className="checkout-mobile-summary-bar"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          aria-expanded={mobileSummaryOpen}
        >
          <div className="checkout-mobile-summary-left">
            <IconShoppingBag size={18} />
            <span>{mobileSummaryOpen ? "Hide order summary" : `Order summary (${itemCount})`}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: mobileSummaryOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease"
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="checkout-mobile-summary-total">
            {formatMoney(cart.totalInCents, "inr")}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="checkout-mobile-summary-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Your Bag</span>
              <Link href="/cart" className="checkout-edit-cart-link">Edit Bag ↗</Link>
            </div>
            {renderSummaryItems()}
            <hr className="checkout-divider" />
            {renderPromoForm()}
            <hr className="checkout-divider" />
            {renderTotals()}
          </div>
        )}
      </div>

      <div className="checkout-body">
        {/* Left column: 3-step progressive view */}
        <div className="checkout-left">

          {/* STEP 1: SHIPPING & ADDRESS */}
          {step === 1 && (
            <>
              {/* Contact Information */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconUser size={18} /></span>
                  <h2>Contact Information</h2>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name <span className="required">*</span></label>
                    <div className="form-input-container">
                      <input
                        id="firstName"
                        className={`form-input ${touched.firstName ? (validateField("firstName", form.firstName) ? "input-error" : "input-valid") : ""}`}
                        type="text"
                        placeholder="First Name"
                        autoComplete="given-name"
                        value={form.firstName}
                        onBlur={() => handleBlur("firstName")}
                        onChange={(e) => updateField("firstName", e.target.value)}
                      />
                      {touched.firstName && !validateField("firstName", form.firstName) && (
                        <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                      )}
                    </div>
                    {touched.firstName && validateField("firstName", form.firstName) && (
                      <p className="form-field-error">{validateField("firstName", form.firstName)}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name <span className="required">*</span></label>
                    <div className="form-input-container">
                      <input
                        id="lastName"
                        className={`form-input ${touched.lastName ? (validateField("lastName", form.lastName) ? "input-error" : "input-valid") : ""}`}
                        type="text"
                        placeholder="Last Name"
                        autoComplete="family-name"
                        value={form.lastName}
                        onBlur={() => handleBlur("lastName")}
                        onChange={(e) => updateField("lastName", e.target.value)}
                      />
                      {touched.lastName && !validateField("lastName", form.lastName) && (
                        <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                      )}
                    </div>
                    {touched.lastName && validateField("lastName", form.lastName) && (
                      <p className="form-field-error">{validateField("lastName", form.lastName)}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address <span className="required">*</span></label>
                    <div className="form-input-container">
                      <input
                        id="email"
                        className={`form-input ${touched.email ? (validateField("email", form.email) ? "input-error" : "input-valid") : ""}`}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={form.email}
                        onBlur={() => handleBlur("email")}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                      {touched.email && !validateField("email", form.email) && (
                        <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                      )}
                    </div>
                    {touched.email && validateField("email", form.email) && (
                      <p className="form-field-error">{validateField("email", form.email)}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Mobile Number <span className="required">*</span></label>
                    <div className="form-input-container">
                      <input
                        id="phone"
                        className={`form-input ${touched.phone ? (validateField("phone", form.phone) ? "input-error" : "input-valid") : ""}`}
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={16}
                        autoComplete="tel"
                        value={form.phone}
                        onBlur={() => handleBlur("phone")}
                        onChange={(e) => {
                          const val = e.target.value;
                          const digits = val.replace(/\D/g, "");
                          if (digits.startsWith("91") && digits.length > 10) {
                            updateField("phone", digits.slice(2, 12));
                          } else if (digits.startsWith("0") && digits.length > 10) {
                            updateField("phone", digits.slice(1, 11));
                          } else {
                            updateField("phone", digits.slice(0, 10));
                          }
                        }}
                      />
                      {touched.phone && !validateField("phone", form.phone) && (
                        <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                      )}
                    </div>
                    {touched.phone && validateField("phone", form.phone) && (
                      <p className="form-field-error">{validateField("phone", form.phone)}</p>
                    )}
                  </div>

                  <div className="form-group full">
                    <p className="form-hint" style={{ marginTop: 0 }}>
                      Order confirmation, receipt &amp; dispatch tracking will be sent to this email &amp; mobile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconMapPin size={18} /></span>
                  <h2>Shipping Address</h2>
                  {user.addresses && user.addresses.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                      {selectedAddressIndex === "new" ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "4px 14px", fontSize: "0.8rem" }}
                          onClick={() => selectSavedAddress(0)}
                        >
                          Use Saved Address
                        </button>
                      ) : (
                        <>
                          <div style={{ position: "relative" }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 14px", fontSize: "0.8rem" }}
                              onClick={() => setAddressDropdownOpen(!addressDropdownOpen)}
                            >
                              Change
                            </button>
                            {addressDropdownOpen && (
                              <>
                                <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setAddressDropdownOpen(false)} />
                                <div style={{
                                  position: "absolute", top: "100%", right: 0, marginTop: "4px",
                                  background: "#fff", border: "1px solid var(--border)", borderRadius: "8px",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: "300px", zIndex: 10, overflow: "hidden"
                                }}>
                                  {user.addresses.map((addr, i) => (
                                    <button
                                      key={addr.id || i}
                                      type="button"
                                      onClick={() => selectSavedAddress(i)}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left", padding: "12px 16px",
                                        border: "none", background: selectedAddressIndex === i ? "#f5f5f5" : "#fff",
                                        cursor: "pointer", fontSize: "0.84rem", borderBottom: "1px solid #eee",
                                        color: "#111"
                                      }}
                                    >
                                      <strong>{[addr.first_name, addr.last_name].filter(Boolean).join(" ")}</strong>
                                      <br />
                                      <span style={{ color: "#666" }}>
                                        {addr.address_1}, {[addr.city, addr.postal_code].filter(Boolean).join(" - ")}
                                      </span>
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={selectNewAddress}
                                    style={{
                                      display: "block", width: "100%", textAlign: "left", padding: "12px 16px",
                                      border: "none", background: "#fff", cursor: "pointer",
                                      fontSize: "0.84rem", fontWeight: 600, color: "var(--accent)"
                                    }}
                                  >
                                    + Add New Address
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: "4px 14px", fontSize: "0.8rem" }}
                            onClick={selectNewAddress}
                          >
                            + Add New
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Show selected saved address summary */}
                {user.addresses && user.addresses.length > 0 && selectedAddressIndex !== "new" && (
                  <div className="checkout-review-card-content" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div>
                        <p className="checkout-review-recipient">
                          {[form.firstName, form.lastName].filter(Boolean).join(" ")}
                        </p>
                        <p className="checkout-review-detail">{form.address || "Street address pending"}</p>
                        {form.address2 && <p className="checkout-review-detail">{form.address2}</p>}
                        <p className="checkout-review-detail">
                          {[form.city, form.state, form.zipCode].filter(Boolean).join(", ")}
                        </p>
                        {form.phone && <p className="checkout-review-detail">Ph: +91 {normalizeIndianPhone(form.phone)}</p>}
                      </div>
                      <button
                        type="button"
                        className="checkout-edit-btn"
                        onClick={() => setShowAddressForm(!showAddressForm)}
                      >
                        {showAddressForm ? "Hide Form" : "Edit Address"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show form when adding new address OR editing saved address */}
                {(selectedAddressIndex === "new" || showAddressForm) && (
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label" htmlFor="address">Street Address <span className="required">*</span></label>
                      <div className="form-input-container">
                        <input
                          id="address"
                          className={`form-input ${touched.address ? (validateField("address", form.address) ? "input-error" : "input-valid") : ""}`}
                          type="text"
                          placeholder="House no., street, locality"
                          autoComplete="street-address"
                          value={form.address}
                          onBlur={() => handleBlur("address")}
                          onChange={(e) => updateField("address", e.target.value)}
                        />
                        {touched.address && !validateField("address", form.address) && (
                          <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                        )}
                      </div>
                      {touched.address && validateField("address", form.address) && (
                        <p className="form-field-error">{validateField("address", form.address)}</p>
                      )}
                    </div>

                    <div className="form-group full">
                      <label className="form-label" htmlFor="address2">Landmark / Apartment (Optional)</label>
                      <div className="form-input-container">
                        <input
                          id="address2"
                          className="form-input"
                          type="text"
                          placeholder="E.g. Near Apollo Hospital, Apt 4B"
                          autoComplete="address-line2"
                          value={form.address2}
                          onChange={(e) => updateField("address2", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="city">City <span className="required">*</span></label>
                      <div className="form-input-container">
                        <input
                          id="city"
                          className={`form-input ${touched.city ? (validateField("city", form.city) ? "input-error" : "input-valid") : ""}`}
                          type="text"
                          placeholder="Hyderabad"
                          autoComplete="address-level2"
                          value={form.city}
                          onBlur={() => handleBlur("city")}
                          onChange={(e) => updateField("city", e.target.value)}
                        />
                        {touched.city && !validateField("city", form.city) && (
                          <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                        )}
                      </div>
                      {touched.city && validateField("city", form.city) && (
                        <p className="form-field-error">{validateField("city", form.city)}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="state">State <span className="required">*</span></label>
                      <div className="form-input-container">
                        <select
                          id="state"
                          className={`form-input ${touched.state ? (validateField("state", form.state) ? "input-error" : "input-valid") : ""}`}
                          value={form.state}
                          autoComplete="address-level1"
                          onBlur={() => handleBlur("state")}
                          onChange={(e) => updateField("state", e.target.value)}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {touched.state && !validateField("state", form.state) && form.state && (
                          <span className="input-validation-icon success" style={{ right: "28px" }} aria-label="Valid"><IconCheck size={16} /></span>
                        )}
                      </div>
                      {touched.state && validateField("state", form.state) && (
                        <p className="form-field-error">{validateField("state", form.state)}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="zipCode">PIN Code <span className="required">*</span></label>
                      <div className="form-input-container">
                        <input
                          id="zipCode"
                          className={`form-input ${touched.zipCode ? (validateField("zipCode", form.zipCode) ? "input-error" : "input-valid") : ""}`}
                          type="text"
                          placeholder="500001"
                          maxLength={8}
                          autoComplete="postal-code"
                          value={form.zipCode}
                          onBlur={() => handleBlur("zipCode")}
                          onChange={(e) => updateField("zipCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        />
                        {touched.zipCode && !validateField("zipCode", form.zipCode) && (
                          <span className="input-validation-icon success" aria-label="Valid"><IconCheck size={16} /></span>
                        )}
                      </div>
                      {touched.zipCode && validateField("zipCode", form.zipCode) && (
                        <p className="form-field-error">{validateField("zipCode", form.zipCode)}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="country">Country</label>
                      <input
                        id="country"
                        className="form-input"
                        type="text"
                        value={form.country}
                        autoComplete="country-name"
                        readOnly
                        style={{ opacity: 0.7, cursor: "not-allowed" }}
                      />
                    </div>

                    <div className="form-group full">
                      <label className="checkout-save-label">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                        />
                        <span>Save address to account</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="checkout-alert checkout-alert-error" style={{ margin: "16px 0", padding: "12px 16px" }}>
                  <div className="checkout-alert-icon" style={{ fontSize: "1rem" }}><IconAlertTriangle size={18} /></div>
                  <div className="checkout-alert-body">
                    <p className="checkout-alert-message" style={{ fontWeight: 600, color: "var(--error)" }}>
                      {validationError}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1 Mobile CTA (on desktop buttons are on right side) */}
              <div className="checkout-mobile-action-btn">
                <button
                  type="button"
                  className="checkout-continue-btn"
                  onClick={handleProceedToReview}
                >
                  Continue to Review Order →
                </button>
              </div>
            </>
          )}

          {/* STEP 2: REVIEW ORDER */}
          {step === 2 && (
            <>
              {/* Shipping Address Review Card */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconMapPin size={18} /></span>
                  <h2>Shipping &amp; Contact Details</h2>
                  <button
                    type="button"
                    className="checkout-edit-btn"
                    onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    Edit Address
                  </button>
                </div>
                <div className="checkout-review-card-content">
                  <p className="checkout-review-recipient">{form.firstName} {form.lastName}</p>
                  <p className="checkout-review-detail">{form.email} · +91 {normalizeIndianPhone(form.phone)}</p>
                  <p className="checkout-review-detail">
                    {form.address}{form.address2 ? `, ${form.address2}` : ""}, {form.city}, {form.state} &ndash; {form.zipCode}, {form.country}
                  </p>
                </div>
              </div>

              {/* Delivery Speed Card */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconTruck size={18} /></span>
                  <h2>Shipping Method</h2>
                </div>
                <div className="shipping-option-card active">
                  <div className="shipping-option-left">
                    <div className="shipping-option-radio" />
                    <div>
                      <p className="shipping-option-name">Standard Complimentary Delivery</p>
                      <p className="shipping-option-meta">Estimated delivery: 7–10 business days</p>
                    </div>
                  </div>
                  <span className="shipping-option-price">FREE</span>
                </div>
              </div>

              {/* Items in Order */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconShoppingBag size={18} /></span>
                  <h2>Items in Your Order ({itemCount})</h2>
                  <Link href="/cart" className="checkout-edit-btn">
                    Edit Bag ↗
                  </Link>
                </div>
                {renderSummaryItems()}
              </div>

              {/* Step 2 Mobile Navigation buttons (on desktop buttons are on right side) */}
              <div className="checkout-mobile-action-btn">
                <button
                  type="button"
                  className="checkout-continue-btn"
                  onClick={handleProceedToPayment}
                >
                  Proceed to Payment →
                </button>
                <button
                  type="button"
                  className="checkout-back-btn"
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  ← Back to Shipping Details
                </button>
              </div>
            </>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <>
              {/* Delivery Recap */}
              <div className="checkout-card" style={{ padding: "18px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                      Delivering to
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: "0.88rem", fontWeight: 600 }}>
                      {form.firstName} {form.lastName} &ndash; {form.city}, {form.zipCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="checkout-edit-btn"
                    onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <span className="checkout-card-icon"><IconCreditCard size={18} /></span>
                  <h2>Payment Method</h2>
                </div>

                <div className="payment-methods-grid">
                  {[
                    { icon: <IconSmartphone size={16} />, label: "UPI (GPay / PhonePe / Paytm)" },
                    { icon: <IconCreditCard size={16} />, label: "Credit & Debit Cards" },
                    { icon: <IconBuilding size={16} />, label: "Net Banking" },
                    { icon: <IconWallet size={16} />, label: "Wallets" },
                  ].map((m) => (
                    <div key={m.label} className="payment-method-chip">
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="payment-razorpay-info">
                  <div className="payment-razorpay-logo">
                    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                      <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z" fill="#712119" />
                      <path d="M16 28l8-16-4 8h6l-10 8z" fill="#fff" />
                    </svg>
                    <span>Powered by <strong>Razorpay</strong> &mdash; 100% Encrypted &amp; Secure</span>
                  </div>
                  <p>
                    Supports all Indian Credit/Debit cards, UPI, Google Pay, PhonePe, Paytm, and Net Banking.
                    Your transaction is encrypted with 256-bit SSL security.
                  </p>
                </div>

                {error && (
                  <div className="checkout-alert checkout-alert-error" style={{ marginTop: "16px" }}>
                    <div className="checkout-alert-icon"><IconAlertTriangle size={20} /></div>
                    <div className="checkout-alert-body">
                      <p className="checkout-alert-title">
                        {recoverablePayment ? "Payment received – confirmation pending" : "Payment Notice"}
                      </p>
                      <p className="checkout-alert-message">{error}</p>
                      {(failureReference?.razorpayPaymentId || failureReference?.razorpayOrderId) && (
                        <p className="checkout-alert-ref">
                          Reference: <code>{failureReference.razorpayPaymentId || failureReference.razorpayOrderId}</code>
                        </p>
                      )}
                      {recoverablePayment && (
                        <button
                          className="btn btn-sm"
                          onClick={handleRetryOrderConfirmation}
                          disabled={isSubmitting}
                          style={{ marginTop: "12px" }}
                        >
                          {isSubmitting ? "Retrying…" : "Retry Order Confirmation"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="checkout-trust-badges">
                  <span><IconLock size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />SSL Secured</span>
                  <span><IconCornerDownLeft size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />48-Hour Exchange</span>
                  <span><IconShield size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />Razorpay Verified</span>
                </div>
              </div>

              {/* Step 3 Mobile Pay & Back CTA (on desktop buttons are on right side) */}
              <div className="checkout-mobile-action-btn">
                <button
                  className="btn btn-full btn-lg checkout-pay-btn"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  id="mobile-pay-now-btn"
                >
                  {isSubmitting ? (
                    <span className="checkout-pay-loading">
                      <span className="spinner-sm" />
                      Processing Payment…
                    </span>
                  ) : (
                    <span>Pay {formatMoney(cart.totalInCents, "inr")}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="checkout-back-btn"
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  ← Back to Order Review
                </button>
              </div>
            </>
          )}

        </div>

        {/* Right column — Order Summary (Desktop) */}
        <aside className="checkout-right">
          <div className="checkout-summary-card">
            <h2 className="checkout-summary-title">
              <span>Order Summary <span className="checkout-summary-count">{itemCount}</span></span>
              <Link href="/cart" className="checkout-edit-cart-link">Edit Bag ↗</Link>
            </h2>

            {renderSummaryItems()}

            <hr className="checkout-divider" />

            {/* Promo Code Entry */}
            {renderPromoForm()}

            <hr className="checkout-divider" />

            {/* Totals Breakdown */}
            {renderTotals()}

            {validationError && (
              <div className="checkout-alert checkout-alert-error" style={{ margin: "14px 0 0", padding: "10px 14px" }}>
                <p className="checkout-alert-message" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--error)" }}>
                  {validationError}
                </p>
              </div>
            )}

            {/* Action buttons on right side */}
            <div className="checkout-summary-actions" style={{ marginTop: "18px" }}>
              {step === 1 && (
                <button
                  type="button"
                  className="btn btn-full btn-lg checkout-continue-btn"
                  onClick={handleProceedToReview}
                >
                  Continue to Review Order →
                </button>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    className="btn btn-full btn-lg checkout-continue-btn"
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment →
                  </button>
                  <button
                    type="button"
                    className="checkout-back-btn"
                    style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                    onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    ← Back to Shipping Details
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  {error && (
                    <div className="checkout-alert checkout-alert-error" style={{ marginBottom: "12px", padding: "10px 14px" }}>
                      <p className="checkout-alert-message" style={{ fontSize: "0.82rem", color: "var(--error)" }}>
                        {error}
                      </p>
                    </div>
                  )}
                  <button
                    className="btn btn-full btn-lg checkout-pay-btn"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    id="summary-pay-btn"
                  >
                    {isSubmitting ? (
                      <span className="checkout-pay-loading">
                        <span className="spinner-sm" />
                        Processing Payment…
                      </span>
                    ) : (
                      <span>Pay {formatMoney(cart.totalInCents, "inr")}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="checkout-back-btn"
                    style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                    onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    ← Back to Order Review
                  </button>
                </>
              )}
            </div>

            <div className="checkout-trust-badges" style={{ marginTop: "18px" }}>
              <span><IconLock size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />SSL Secured</span>
              <span><IconCornerDownLeft size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />48-Hour Exchange</span>
              <span><IconShield size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />Razorpay Verified</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "var(--space-4xl) 0", textAlign: "center" }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
