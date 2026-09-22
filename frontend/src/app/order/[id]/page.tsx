"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Order, OrderRequest, OrderRequestItem, OrderRequestType } from "@/lib/types";
import { buildInvoiceText, createOrderRequest, getOrderById, getOrderRequests } from "@/lib/api/orders";
import { useAuth } from "@/components/AuthProvider";

const returnReasons = [
  "Size or fit issue",
  "Damaged or defective item",
  "Wrong item received",
  "Changed my mind",
  "Other"
];

const cancelReasons = ["Ordered by mistake", "Need to change address", "Found another product", "Other"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    pending:    { color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Pending" },
    processing: { color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Processing" },
    confirmed:  { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Confirmed" },
    shipped:    { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", label: "Shipped" },
    fulfilled:  { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Fulfilled" },
    cancelled:  { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Cancelled" },
    authorized: { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Authorized" },
    captured:   { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Captured" },
    failed:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Failed" },
  };
  const s = map[status] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px",
      background: s.bg, color: s.color, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.02em" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function OrderNotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", gap: "16px", padding: "40px 24px" }}>
      <div style={{ fontSize: "3rem" }}>🔍</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Order not found</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "360px", lineHeight: 1.6 }}>
        We couldn&apos;t find this order. It may still be processing, or the link may be incorrect.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/account" className="btn btn-secondary">View My Orders</Link>
        <Link href="/products" className="btn">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requestType, setRequestType] = useState<OrderRequestType>("return");
  const [reason, setReason] = useState(returnReasons[0]);
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    getOrderById(params.id)
      .then((o) => {
        if (!o) { setNotFound(true); } else { setOrder(o); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!token) return;
    getOrderRequests(token, params.id)
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [params.id, token]);

  useEffect(() => {
    setReason(requestType === "cancel" ? cancelReasons[0] : returnReasons[0]);
  }, [requestType]);

  const downloadInvoice = () => {
    if (!order) return;
    const blob = new Blob([buildInvoiceText(order)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `irraya-invoice-${order.displayId || order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitOrderRequest = async () => {
    if (!order || !token) { setRequestError("Please sign in to submit a request."); return; }
    setIsSubmittingRequest(true);
    setRequestMessage("");
    setRequestError("");
    try {
      const items: OrderRequestItem[] = requestType === "cancel"
        ? []
        : order.items.filter((item) => selectedItems[item.id])
            .map((item) => ({ itemId: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity }));
      const { request, message } = await createOrderRequest({ token, orderId: order.id, type: requestType, reason, notes, items });
      setRequests((prev) => [request, ...prev]);
      setRequestMessage(message);
      setNotes("");
      setSelectedItems({});
    } catch (error: unknown) {
      setRequestError(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const timelineSteps = [
    { key: "ordered",    label: "Order Placed",     icon: "📋", active: true },
    { key: "processing", label: "Processing",        icon: "⚙️", active: Boolean(order) && order?.status !== "cancelled" },
    { key: "shipped",    label: "Shipped",           icon: "📦", active: ["shipped", "out_for_delivery", "delivered"].includes(order?.tracking?.status ?? "") || order?.status === "fulfilled" },
    { key: "delivery",   label: "Out for Delivery",  icon: "🚚", active: ["out_for_delivery", "delivered"].includes(order?.tracking?.status ?? "") },
    { key: "delivered",  label: "Delivered",         icon: "✅", active: order?.tracking?.status === "delivered" },
  ];

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <div className="spinner" />
        <p className="text-secondary">Loading your order…</p>
      </div>
    );
  }

  if (notFound) return <OrderNotFound />;

  const isCancelled = order?.status === "cancelled";
  const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;
  const addr = order?.shippingAddress;
  const addrLine = addr ? [addr.address1, addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ") : null;

  return (
    <div className="order-confirmation-page">
      {/* Hero */}
      <div className={`order-hero ${isCancelled ? "order-hero-cancelled" : ""}`}>
        <div className="order-hero-inner">
          <div className={`order-hero-icon ${isCancelled ? "cancelled" : ""}`}>
            {isCancelled ? "✕" : "✓"}
          </div>
          <h1>{isCancelled ? "Order Cancelled" : "Order Confirmed!"}</h1>
          <p className="order-hero-sub">
            {isCancelled
              ? "Your order has been cancelled. Any payment will be refunded within 5–7 business days."
              : `Thank you! Your order #${order?.displayId || params.id} has been placed successfully.`}
          </p>
          {!isCancelled && orderDate && (
            <p className="order-hero-email">Placed on {orderDate}</p>
          )}
          {!isCancelled && (
            <p className="order-hero-email">A confirmation has been sent to your email address.</p>
          )}
          {!isCancelled && (
            <div className="order-hero-badges">
              <span className="order-hero-badge">🔒 Payment Secure</span>
              <span className="order-hero-badge">📦 Free Shipping</span>
              <span className="order-hero-badge">↩ 30-Day Returns</span>
            </div>
          )}
        </div>
      </div>

      <div className="order-body">
        {/* Tracking Timeline */}
        {!isCancelled && (
          <div className="order-card">
            <h2 className="order-card-title">📍 Order Progress</h2>
            <div className="order-timeline">
              {timelineSteps.map((step, i) => (
                <div key={step.key} className={`order-timeline-step ${step.active ? "active" : ""}`}>
                  <div className="order-timeline-icon-wrap">
                    <div className="order-timeline-icon">{step.active ? step.icon : String(i + 1)}</div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`order-timeline-line ${step.active && timelineSteps[i + 1]?.active ? "filled" : ""}`} />
                    )}
                  </div>
                  <span className="order-timeline-label">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="order-grid">
          {/* Left column: Order Details + Actions */}
          <div>
            <div className="order-card">
              <h2 className="order-card-title">Order Details</h2>
              <div className="order-detail-list">
                <div className="order-detail-item">
                  <span className="order-detail-label">Order ID</span>
                  <span className="order-detail-value order-id-chip">
                    #{order?.displayId || params.id}
                  </span>
                </div>
                {orderDate && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Order Date</span>
                    <span className="order-detail-value">{orderDate}</span>
                  </div>
                )}
                <div className="order-detail-item">
                  <span className="order-detail-label">Order Status</span>
                  <StatusBadge status={order?.status || "processing"} />
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">Payment</span>
                  <StatusBadge status={order?.payment?.status || "authorized"} />
                </div>
                {order?.payment?.providerPaymentId && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Payment ID</span>
                    <code className="order-detail-code">{order.payment.providerPaymentId}</code>
                  </div>
                )}
                <div className="order-detail-item">
                  <span className="order-detail-label">Estimated Delivery</span>
                  <span className="order-detail-value" style={{ fontWeight: 600 }}>
                    {order?.tracking?.estimatedDelivery
                      ? new Date(order.tracking.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                      : "5–7 Business Days"}
                  </span>
                </div>
                {order?.tracking?.trackingNumber && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Tracking</span>
                    <span className="order-detail-value">
                      {order.tracking.trackingUrl ? (
                        <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer" className="order-track-link">
                          {order.tracking.carrier && `${order.tracking.carrier} · `}{order.tracking.trackingNumber} ↗
                        </a>
                      ) : (
                        `${order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}${order.tracking.trackingNumber}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {addrLine && (
              <div className="order-card">
                <h2 className="order-card-title">Shipping Address</h2>
                <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {addr?.firstName && addr?.lastName && (
                    <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                      {addr.firstName} {addr.lastName}
                    </p>
                  )}
                  <p>{addrLine}</p>
                  {addr?.countryCode && <p style={{ textTransform: "uppercase", color: "var(--text-muted)", fontSize: "0.78rem" }}>{addr.countryCode}</p>}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="order-actions">
              <button className="btn btn-secondary" onClick={downloadInvoice} disabled={!order}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "6px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Invoice
              </button>
              <Link href="/products" className="btn">Continue Shopping</Link>
            </div>

            {/* Support note */}
            <div className="order-support-card">
              <p className="order-support-title">Need help with your order?</p>
              <p className="order-support-text">
                Contact our support team at <strong>support@irraya.in</strong> with your order ID <strong>#{order?.displayId || params.id}</strong> and we'll assist you promptly.
              </p>
              <Link href="/returns" className="order-support-link">View Returns Policy →</Link>
            </div>
          </div>

          {/* Right column: Items + Summary + Manage */}
          <div>
            {order && (
              <div className="order-card">
                <h2 className="order-card-title">Items Ordered</h2>
                <div className="order-items-list">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-row">
                      <div className="order-item-placeholder">
                        {(item.title || "P").charAt(0)}
                      </div>
                      <div className="order-item-info">
                        <p className="order-item-title">{item.title ?? "Product"}</p>
                        <p className="order-item-meta">
                          Qty: {item.quantity}
                          {item.size ? ` · Size: ${item.size}` : ""}
                          {item.color ? ` · ${item.color}` : ""}
                        </p>
                        <p className="order-item-unit-price" style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {formatMoney(item.unitPriceInCents, order.currencyCode)} each
                        </p>
                      </div>
                      <span className="order-item-price">
                        {formatMoney(item.unitPriceInCents * item.quantity, order.currencyCode)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="order-summary-totals">
                  <div className="order-summary-row">
                    <span>Subtotal ({order.items.length} {order.items.length === 1 ? "item" : "items"})</span>
                    <span>{formatMoney(order.subtotalInCents ?? order.totalInCents, order.currencyCode)}</span>
                  </div>
                  <div className="order-summary-row">
                    <span>Shipping</span>
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>Free</span>
                  </div>
                  <div className="order-summary-row" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>GST (included in price)</span>
                    <span>Incl.</span>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
                  <div className="order-summary-row order-summary-total">
                    <span>Total Paid</span>
                    <span>{formatMoney(order.totalInCents, order.currencyCode)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Order */}
            {order && (
              <div className="order-card">
                <button
                  className="order-manage-toggle"
                  onClick={() => setManageOpen((v) => !v)}
                >
                  <span>Manage this Order</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: manageOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {manageOpen && (
                  <div className="order-manage-body">
                    <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "16px" }}>
                      Cancel requests are reviewed before fulfillment. Returns and exchanges are available within 30 days of delivery.
                    </p>

                    {requestMessage && (
                      <div className="order-manage-success">{requestMessage}</div>
                    )}
                    {requestError && (
                      <div className="order-manage-error">{requestError}</div>
                    )}

                    <div className="form-grid" style={{ marginBottom: "16px" }}>
                      <div className="form-group">
                        <label className="form-label">Request Type</label>
                        <select className="form-input" value={requestType}
                          onChange={(e) => setRequestType(e.target.value as OrderRequestType)}>
                          <option value="return" disabled={!order.eligibility?.canReturn}>Return</option>
                          <option value="exchange" disabled={!order.eligibility?.canExchange}>Exchange</option>
                          <option value="cancel" disabled={!order.eligibility?.canCancel}>Cancel</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Reason</label>
                        <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                          {(requestType === "cancel" ? cancelReasons : returnReasons).map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      {requestType !== "cancel" && (
                        <div className="form-group full">
                          <label className="form-label">Select items to return/exchange</label>
                          {order.items.map((item) => (
                            <label key={item.id} className="order-item-check">
                              <input type="checkbox" checked={Boolean(selectedItems[item.id])}
                                onChange={(e) => setSelectedItems((prev) => ({ ...prev, [item.id]: e.target.checked }))} />
                              {item.title ?? "Product"} × {item.quantity}
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="form-group full">
                        <label className="form-label">Additional Notes</label>
                        <textarea className="form-input" rows={3} value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any details our support team should know…" />
                      </div>
                    </div>

                    {!token && <p style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "12px" }}>Sign in to submit a request.</p>}

                    <button className="btn" onClick={submitOrderRequest} disabled={!token || isSubmittingRequest}>
                      {isSubmittingRequest ? "Submitting…" : `Submit ${requestType} request`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Request history */}
            {requests.length > 0 && (
              <div className="order-card">
                <h2 className="order-card-title">Request History</h2>
                <div className="order-detail-list">
                  {requests.map((request) => (
                    <div key={request.id} className="order-detail-item">
                      <span className="order-detail-label">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)} &middot;{" "}
                        {new Date(request.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
