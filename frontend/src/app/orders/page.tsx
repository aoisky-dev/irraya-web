"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import { getMyOrders } from "@/lib/api/orders";
import { IconPackage } from "@/components/Icons";

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "#d97706", bg: "rgba(217,119,6,0.1)",    label: "Pending" },
  confirmed:  { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Confirmed" },
  fulfilled:  { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Fulfilled" },
  cancelled:  { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   label: "Cancelled" },
  authorized: { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Paid" },
  captured:   { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Paid" },
  failed:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   label: "Failed" },
  cancel_rejected:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Cancel Rejected" },
  cancel_requested:    { color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Cancel Requested" },
  exchange_requested:  { color: "#4f46e5", bg: "rgba(99,102,241,0.1)", label: "Exchange Requested" },
  exchange_approved:   { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Exchange Approved" },
  exchange_rejected:   { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Exchange Rejected" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: status.replace(/_/g, " ") };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px",
      background: s.bg, color: s.color,
      fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em",
      whiteSpace: "nowrap", textTransform: "capitalize"
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function getDisplayStatus(order: Order): string {
  if (order.status === "cancelled") return "cancelled";
  if (order.latestRequest) {
    const { type, status } = order.latestRequest;
    if (type === "cancel" && ["approved", "completed", "refunded"].includes(status)) return "cancelled";
    return `${type}_${status}`;
  }
  return order.status;
}

export default function OrdersPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!token) { setIsLoadingOrders(false); return; }
    setIsLoadingOrders(true);
    getMyOrders(token)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setIsLoadingOrders(false));
  }, [token]);

  useEffect(() => {
    if (isClient && !isLoading && !user) router.push("/login?next=%2Forders");
  }, [user, isLoading, router, isClient]);

  if (!isClient || isLoading || !user) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading...
      </div>
    );
  }

  return (
    <section className="account-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-md)" }}>
        <div>
          <span className="hero-tag">My Orders</span>
          <h1 className="page-title" style={{ marginTop: "var(--space-xs)" }}>
            Order History
            {orders.length > 0 && (
              <span style={{ marginLeft: "8px", fontWeight: 400, color: "var(--text-muted)", fontSize: "0.5em" }}>
                ({orders.length})
              </span>
            )}
          </h1>
        </div>
        <Link href="/account" className="btn btn-outline">← Back to Account</Link>
      </div>

      {isLoadingOrders ? (
        <div className="account-empty-state">
          <div className="spinner" />
          <p>Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="account-empty-state" style={{ padding: "var(--space-4xl) var(--space-xl)" }}>
          <div style={{ color: "var(--border)" }}><IconPackage size={48} /></div>
          <h3>No orders yet</h3>
          <p className="text-muted">When you place orders, they will appear here.</p>
          <Link href="/products" className="btn btn-secondary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const displayStatus = getDisplayStatus(order);
            const firstItem = order.items[0];
            const otherItemsCount = order.items.length - 1;

            return (
              <div key={order.id} className="orders-card">
                {/* Product image — large, left side */}
                <div className="orders-card-image">
                  {firstItem?.image ? (
                    <Image
                      src={firstItem.image}
                      alt={firstItem.title || "Product"}
                      width={140}
                      height={140}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  ) : (
                    <div className="orders-card-image-placeholder">
                      {(firstItem?.title || "P")[0]}
                    </div>
                  )}
                  {otherItemsCount > 0 && (
                    <span className="orders-card-more-badge">+{otherItemsCount}</span>
                  )}
                </div>

                {/* Details — middle to right */}
                <div className="orders-card-details">
                  <div className="orders-card-top">
                    <div>
                      <p className="orders-card-title">{firstItem?.title || "Order"}</p>
                      <p className="orders-card-meta">
                        {firstItem?.size ? `Size: ${firstItem.size}` : ""}
                        {firstItem?.size && firstItem?.color ? " · " : ""}
                        {firstItem?.color || ""}
                        {otherItemsCount > 0 ? ` · ${otherItemsCount} more item${otherItemsCount > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                    <div className="orders-card-price">
                      {formatMoney(order.totalInCents, order.currencyCode)}
                    </div>
                  </div>

                  <div className="orders-card-info">
                    <div className="orders-card-info-row">
                      <span className="orders-card-label">Order</span>
                      <span className="orders-card-value">#{order.displayId || order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="orders-card-info-row">
                      <span className="orders-card-label">Placed</span>
                      <span className="orders-card-value">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="orders-card-info-row">
                      <span className="orders-card-label">Status</span>
                      <StatusPill status={displayStatus} />
                    </div>
                    {order.payment?.status && (
                      <div className="orders-card-info-row">
                        <span className="orders-card-label">Payment</span>
                        <StatusPill status={order.payment.status} />
                      </div>
                    )}
                  </div>

                  {/* Tracking */}
                  {order.tracking?.trackingNumber && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "var(--space-sm)" }}>
                      Tracking:{" "}
                      {order.tracking.trackingUrl ? (
                        <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-warm)", fontWeight: 600 }}>
                          {order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber} ↗
                        </a>
                      ) : (
                        <span>{order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="orders-card-actions">
                    <Link href={`/order/${order.id}?view=status`} className="btn btn-secondary">View Order</Link>
                    {order.eligibility?.canExchange && (
                      <Link href={`/order/${order.id}?open=exchange`} className="btn btn-outline">Exchange</Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
