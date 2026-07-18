"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { Order, OrderRequestType } from "@/lib/types";
import { createOrderRequest, getMyOrders, getOrderRequests } from "@/lib/api/orders";

const reasons = [
  "Size or fit issue",
  "Damaged or defective item",
  "Wrong item received",
  "Changed my mind",
  "Other"
];

export default function ReturnsPage() {
  const { token, user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [orderId, setOrderId] = useState("");
  const [requestType, setRequestType] = useState<OrderRequestType>("return");
  const [reason, setReason] = useState(reasons[0]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([getMyOrders(token), getOrderRequests(token)])
      .then(([orders, requests]) => {
        setOrders(orders);
        setRequests(requests);
        const firstEligible = orders.find((order) => order.eligibility?.canReturn || order.eligibility?.canExchange);
        if (firstEligible) setOrderId(firstEligible.id);
      })
      .catch((error: unknown) => setError(error instanceof Error ? error.message : "Unable to load return data."));
  }, [token]);

  const eligibleOrders = useMemo(() => orders.filter((order) => (
    requestType === "return" ? order.eligibility?.canReturn : order.eligibility?.canExchange
  )), [orders, requestType]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Please sign in to request a return or exchange.");
      return;
    }
    if (!orderId) {
      setError("Select an eligible order.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const order = orders.find((item) => item.id === orderId);
      const { request, message } = await createOrderRequest({
        token,
        orderId,
        type: requestType,
        reason,
        notes,
        items: order?.items.map((item) => ({ itemId: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity })) ?? []
      });
      setRequests((prev) => [request, ...prev]);
      setMessage(message);
      setNotes("");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "var(--space-2xl) 0", maxWidth: "800px" }}>
      <h1 className="section-title" style={{ fontSize: "2.5rem", marginBottom: "var(--space-xl)" }}>Generous Return Policy</h1>

      {!isLoading && !user && (
        <div className="cart-empty" style={{ padding: "var(--space-xl)", marginBottom: "var(--space-xl)" }}>
          <h2>Sign in to start a return or exchange</h2>
          <p>Your order history is required to check return eligibility.</p>
          <Link href="/login?next=%2Freturns" className="btn btn-primary">Sign In</Link>
        </div>
      )}

      {user && (
        <div className="checkout-section" style={{ marginBottom: "var(--space-xl)" }}>
          <h2>Start a return or exchange</h2>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
            Eligible orders are within 30 days and not cancelled. Admin approval and refund processing happen in Medusa Admin.
          </p>
          {message && <p style={{ color: "var(--success, green)", marginBottom: "var(--space-md)" }}>{message}</p>}
          {error && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>{error}</p>}
          <form onSubmit={submitRequest} className="form-grid">
            <div className="form-group">
              <label className="form-label">Request type</label>
              <select className="form-input" value={requestType} onChange={(event) => setRequestType(event.target.value as OrderRequestType)}>
                <option value="return">Return</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Eligible order</label>
              <select className="form-input" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
                <option value="">Select order</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>#{order.id.slice(-6).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Reason</label>
              <select className="form-input" value={reason} onChange={(event) => setReason(event.target.value)}>
                {reasons.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tell us what happened or what exchange you need." />
            </div>
            <div className="form-group full">
              <button className="btn" disabled={isSubmitting || !orderId}>{isSubmitting ? "Submitting..." : "Submit request"}</button>
            </div>
          </form>
        </div>
      )}

      {requests.length > 0 && (
        <div className="checkout-section" style={{ marginBottom: "var(--space-xl)" }}>
          <h2>Your return/exchange requests</h2>
          {requests.map((request) => (
            <div key={request.id} className="order-detail-row">
              <span>{request.type?.toUpperCase?.() ?? request.request_type?.toUpperCase?.()} · Order #{String(request.orderId ?? request.order_id).slice(-6).toUpperCase()}</span>
              <span className="badge">{String(request.status).replace(/_/g, " ").toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

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
