"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import { getMyOrders } from "@/lib/api/orders";
import { IconPackage, IconSearch } from "@/components/Icons";

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Pending" },
  processing: { color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Processing" },
  confirmed:  { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Confirmed" },
  shipped:    { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", label: "Shipped" },
  out_for_delivery: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", label: "Out for Delivery" },
  delivered:  { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Delivered" },
  fulfilled:  { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Fulfilled" },
  cancelled:  { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Cancelled" },
  authorized: { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Authorized" },
  captured:   { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Captured" },
  failed:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Failed" },
  requested:    { color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Requested" },
  under_review: { color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Under Review" },
  approved:     { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Approved" },
  rejected:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Rejected" },
  refunded:     { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Refunded" },
  completed:    { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Completed" },
  cancel_requested:      { color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Cancel Requested" },
  cancel_approved:       { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Cancelled" },
  cancel_rejected:       { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Cancel Rejected" },
  exchange_requested:    { color: "#4f46e5", bg: "rgba(99,102,241,0.1)", label: "Exchange Requested" },
  exchange_under_review: { color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Exchange Under Review" },
  exchange_approved:     { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Exchange Approved" },
  exchange_rejected:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Exchange Rejected" },
  exchange_completed:    { color: "#059669", bg: "rgba(5,150,105,0.1)", label: "Exchange Completed" },
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
  return order.tracking?.status || order.status;
}

// For filter tabs
type FilterStatus = "all" | "active" | "delivered" | "cancelled";
type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc";

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "amount_desc", label: "Amount: High to Low" },
  { key: "amount_asc", label: "Amount: Low to High" },
];

function matchesFilter(order: Order, filter: FilterStatus): boolean {
  const ds = getDisplayStatus(order);
  if (filter === "all") return true;
  if (filter === "delivered") return ds === "delivered";
  if (filter === "cancelled") return ds === "cancelled" || ds === "cancel_approved";
  // active = everything else
  return !["delivered", "cancelled", "cancel_approved"].includes(ds);
}

function matchesSearch(order: Order, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const ref = (order.orderRef || order.displayId || order.id).toLowerCase();
  if (ref.includes(lower)) return true;
  return order.items.some(item => (item.title || "").toLowerCase().includes(lower));
}

function applySort(orders: Order[], sort: SortKey): Order[] {
  return [...orders].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "amount_desc") return b.totalInCents - a.totalInCents;
    if (sort === "amount_asc") return a.totalInCents - b.totalInCents;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("newest");

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

  const filtered = useMemo(() => {
    const base = orders.filter(o => matchesFilter(o, filter) && matchesSearch(o, search));
    return applySort(base, sort);
  }, [orders, filter, search, sort]);

  if (!isClient || isLoading || !user) {
    return <div className="loading"><div className="spinner" />Loading...</div>;
  }

  return (
    <section className="account-shell">
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--space-md)",
        paddingBottom: "var(--space-md)",
        borderBottom: "1px solid var(--border)",
        marginBottom: "var(--space-xl)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 className="page-title" style={{ margin: 0, lineHeight: 1 }}>My Orders</h1>
          {orders.length > 0 && (
            <span style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1px solid var(--border)"
            }}>
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          )}
        </div>
        <Link href="/account" className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>← Back to Account</Link>
      </div>

      {/* Toolbar: Filters, Search & Sort */}
      {!isLoadingOrders && orders.length > 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "var(--space-md)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-md)" }}>
            
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", flex: "1 1 auto", minWidth: "250px" }}>
              {FILTER_TABS.map(tab => {
                const count = orders.filter(o => matchesFilter(o, tab.key)).length;
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: active ? "1px solid var(--text-primary)" : "1px solid transparent",
                      background: active ? "var(--text-primary)" : "transparent",
                      color: active ? "var(--bg-primary)" : "var(--text-primary)",
                      fontWeight: active ? 600 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span style={{
                        fontSize: "0.75rem",
                        background: active ? "rgba(255,255,255,0.25)" : "var(--border)",
                        color: active ? "inherit" : "var(--text-muted)",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search and Sort */}
            <div style={{ display: "flex", gap: "12px", flex: "1 1 auto", justifyContent: "flex-end", minWidth: "300px" }}>
              <div style={{ position: "relative", flex: "1 1 auto", maxWidth: "300px" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                  <IconSearch size={16} />
                </div>
                <input
                  type="search"
                  placeholder="Search orders..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    outline: "none",
                    minWidth: "160px"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                >
                  {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoadingOrders ? (
        <div className="account-empty-state"><div className="spinner" /><p>Loading orders…</p></div>
      ) : orders.length === 0 ? (
        <div className="account-empty-state" style={{ padding: "var(--space-4xl) var(--space-xl)" }}>
          <div style={{ color: "var(--border)" }}><IconPackage size={48} /></div>
          <h3>No orders yet</h3>
          <p className="text-muted">When you place orders, they will appear here.</p>
          <Link href="/products" className="btn btn-secondary">Start Shopping</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="account-empty-state" style={{ padding: "var(--space-2xl) var(--space-xl)" }}>
          <p className="text-muted">No orders match your search or filter.</p>
          <button className="btn btn-outline" style={{ marginTop: "var(--space-sm)" }} onClick={() => { setSearch(""); setFilter("all"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => {
            const displayStatus = getDisplayStatus(order);
            const firstItem = order.items[0];
            const otherItemsCount = order.items.length - 1;
            const orderLabel = order.orderRef || (order.displayId ? `#${order.displayId}` : order.id.slice(-8).toUpperCase());
            const isDelivered = displayStatus === "delivered" || displayStatus === "fulfilled";

            return (
              <div
                key={order.id}
                className="orders-card"
                onClick={() => router.push(`/order/${order.id}?view=status`)}
                style={{ cursor: "pointer" }}
              >
                {/* Product image */}
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

                {/* Details */}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="orders-card-price">
                        {formatMoney(order.totalInCents, order.currencyCode)}
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "1.3rem", lineHeight: 1, flexShrink: 0 }}>›</span>
                    </div>
                  </div>

                  <div className="orders-card-info">
                    <div className="orders-card-info-row">
                      <span className="orders-card-label">Order</span>
                      <span className="orders-card-value" style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{orderLabel}</span>
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

                  {order.tracking?.trackingNumber && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "var(--space-sm)" }}>
                      Tracking:{" "}
                      {order.tracking.trackingUrl ? (
                        <a
                          href={order.tracking.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--accent-warm)", fontWeight: 600 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber} ↗
                        </a>
                      ) : (
                        <span>{order.tracking.carrier ? `${order.tracking.carrier} · ` : ""}{order.tracking.trackingNumber}</span>
                      )}
                    </div>
                  )}

                  <div className="orders-card-actions">
                    {order.eligibility?.canExchange && (
                      <Link
                        href={`/order/${order.id}?open=exchange`}
                        className="btn btn-outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Exchange
                      </Link>
                    )}
                    {isDelivered && (
                      <Link
                        href={`/products/${order.items[0]?.handle || order.items[0]?.productId || ""}`}
                        className="btn btn-outline"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.83rem",
                          borderColor: "var(--accent-warm)",
                          color: "var(--accent-warm)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ★ Rate &amp; Review
                      </Link>
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
