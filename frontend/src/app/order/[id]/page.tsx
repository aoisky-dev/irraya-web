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

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestType, setRequestType] = useState<OrderRequestType>("return");
  const [reason, setReason] = useState(returnReasons[0]);
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    getOrderById(params.id)
      .then(setOrder)
      .catch(() => {
        // If we can't fetch, create a minimal display from URL
        setOrder(null);
      })
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
    link.download = `irraya-invoice-${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timelineSteps = [
    { key: "ordered", label: "Ordered", active: true },
    { key: "processing", label: "Processing", active: Boolean(order) && order?.status !== "cancelled" },
    { key: "shipped", label: "Shipped", active: ["shipped", "out_for_delivery", "delivered"].includes(order?.tracking?.status ?? "") || order?.status === "fulfilled" },
    { key: "out_for_delivery", label: "Out for delivery", active: ["out_for_delivery", "delivered"].includes(order?.tracking?.status ?? "") },
    { key: "delivered", label: "Delivered", active: order?.tracking?.status === "delivered" || order?.status === "fulfilled" }
  ];

  const submitOrderRequest = async () => {
    if (!order || !token) {
      setRequestError("Please sign in to submit a request for this order.");
      return;
    }

    setIsSubmittingRequest(true);
    setRequestMessage("");
    setRequestError("");

    try {
      const items: OrderRequestItem[] = requestType === "cancel"
        ? []
        : order.items
          .filter((item) => selectedItems[item.id])
          .map((item) => ({ itemId: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity }));

      const { request, message } = await createOrderRequest({
        token,
        orderId: order.id,
        type: requestType,
        reason,
        notes,
        items
      });

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

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading order...
      </div>
    );
  }

  return (
    <div className="order-success">
      <div className="order-success-icon">✓</div>
      <h1>Order Confirmed!</h1>
      <p>
        Thank you for your purchase. Your order has been placed successfully
        and you will receive a confirmation email shortly.
      </p>

      <div className="tracking-timeline">
        {timelineSteps.map((step, index) => (
          <div key={step.key} className={`tracking-step ${step.active ? "active" : ""}`}>
            <div className="tracking-icon">{step.active ? "✓" : index + 1}</div>
            <div className="tracking-label">{step.label}</div>
          </div>
        ))}
      </div>

      <div className="order-details">
        <div className="order-detail-row">
          <span className="label">Order ID</span>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{params.id}</span>
        </div>
        <div className="order-detail-row">
          <span className="label">Status</span>
          <span className="badge badge-success">
            {order?.status === "confirmed" ? "Confirmed" : "Processing"}
          </span>
        </div>
        <div className="order-detail-row">
          <span className="label">Payment</span>
          <span className="badge badge-success">
            {order?.payment?.status === "captured" ? "Captured" : order?.payment?.status === "failed" ? "Failed" : "Authorized"}
          </span>
        </div>
        {order?.payment?.providerPaymentId && (
          <div className="order-detail-row">
            <span className="label">Razorpay Payment ID</span>
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{order.payment.providerPaymentId}</span>
          </div>
        )}

        {order && (
          <>
            <hr className="divider" />
            <div className="order-detail-row">
              <span className="label">Items</span>
              <span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="order-detail-row">
              <span className="label">Total</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                {formatMoney(order.totalInCents, order.currencyCode)}
              </span>
            </div>
          </>
        )}

        <div className="order-detail-row">
          <span className="label">Estimated Delivery</span>
          <span>{order?.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toLocaleDateString() : "5–7 Business Days"}</span>
        </div>
        {order?.tracking?.trackingNumber && (
          <div className="order-detail-row">
            <span className="label">Tracking</span>
            {order.tracking.trackingUrl ? (
              <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer">{order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber}</a>
            ) : (
              <span>{order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber}</span>
            )}
          </div>
        )}
      </div>

      {order && (
        <div className="order-details" style={{ marginTop: "var(--space-xl)", textAlign: "left" }}>
          <h2 style={{ marginBottom: "var(--space-md)" }}>Items</h2>
          {order.items.map((item) => (
            <div key={item.id} className="order-detail-row" style={{ alignItems: "flex-start", gap: "var(--space-md)" }}>
              <label style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-start", flex: 1 }}>
                {requestType !== "cancel" && (
                  <input
                    type="checkbox"
                    checked={Boolean(selectedItems[item.id])}
                    onChange={(event) => setSelectedItems((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                  />
                )}
                <span>
                  <strong>{item.title ?? "Product"}</strong>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.85rem" }}>
                    Qty {item.quantity}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}
                  </span>
                </span>
              </label>
              <span>{formatMoney(item.unitPriceInCents * item.quantity, order.currencyCode)}</span>
            </div>
          ))}
        </div>
      )}

      {order && (
        <div className="order-details" style={{ marginTop: "var(--space-xl)", textAlign: "left" }}>
          <h2 style={{ marginBottom: "var(--space-md)" }}>Manage this order</h2>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
            Cancel requests are reviewed before fulfillment. Exchanges are available within 7 days where eligible. Admin processing happens in Medusa Admin.
          </p>

          {requestMessage && <p style={{ color: "var(--success, green)", marginBottom: "var(--space-md)" }}>{requestMessage}</p>}
          {requestError && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>{requestError}</p>}

          <div className="form-grid" style={{ marginBottom: "var(--space-md)" }}>
            <div className="form-group">
              <label className="form-label">Request type</label>
              <select className="form-input" value={requestType} onChange={(event) => setRequestType(event.target.value as OrderRequestType)}>
                <option value="return" disabled={!order.eligibility?.canReturn}>Return</option>
                <option value="exchange" disabled={!order.eligibility?.canExchange}>Exchange</option>
                <option value="cancel" disabled={!order.eligibility?.canCancel}>Cancel</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-input" value={reason} onChange={(event) => setReason(event.target.value)}>
                {(requestType === "cancel" ? cancelReasons : returnReasons).map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Share any details our support team should know." />
            </div>
          </div>

          {!token && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>Sign in to submit a request for this order.</p>}

          <button className="btn" onClick={submitOrderRequest} disabled={!token || isSubmittingRequest}>
            {isSubmittingRequest ? "Submitting..." : `Submit ${requestType} request`}
          </button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="order-details" style={{ marginTop: "var(--space-xl)", textAlign: "left" }}>
          <h2 style={{ marginBottom: "var(--space-md)" }}>Request history</h2>
          {requests.map((request) => (
            <div key={request.id} className="order-detail-row">
              <span className="label">{request.type.toUpperCase()} · {new Date(request.createdAt).toLocaleDateString()}</span>
              <span className="badge">{request.status.replace(/_/g, " ").toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={downloadInvoice} disabled={!order}>
          Download Invoice
        </button>
        <Link href="/returns" className="btn btn-secondary">
          Returns Portal
        </Link>
        <Link href="/products" className="btn">
          Continue Shopping
        </Link>
        <Link href="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
