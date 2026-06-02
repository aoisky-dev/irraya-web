"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import { config } from "@/lib/config";

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${config.backendBaseUrl}/orders/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setOrder)
      .catch(() => {
        // If we can't fetch, create a minimal display from URL
        setOrder(null);
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

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

      {/* Tracking Timeline */}
      <div className="tracking-timeline">
        <div className="tracking-step active">
          <div className="tracking-icon">✓</div>
          <div className="tracking-label">Ordered</div>
        </div>
        <div className="tracking-step active">
          <div className="tracking-icon">2</div>
          <div className="tracking-label">Processing</div>
        </div>
        <div className="tracking-step">
          <div className="tracking-icon">3</div>
          <div className="tracking-label">Shipped</div>
        </div>
        <div className="tracking-step">
          <div className="tracking-icon">4</div>
          <div className="tracking-label">Out for delivery</div>
        </div>
        <div className="tracking-step">
          <div className="tracking-icon">5</div>
          <div className="tracking-label">Delivered</div>
        </div>
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
          <span className="badge badge-success">Authorized</span>
        </div>

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
          <span>5–7 Business Days</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
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
