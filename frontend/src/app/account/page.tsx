"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import { getMyOrders } from "@/lib/api/orders";

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "#d97706", bg: "rgba(217,119,6,0.1)",    label: "Pending" },
  confirmed:  { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Confirmed" },
  fulfilled:  { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Fulfilled" },
  cancelled:  { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   label: "Cancelled" },
  authorized: { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Paid" },
  captured:   { color: "#059669", bg: "rgba(5,150,105,0.1)",   label: "Paid" },
  failed:     { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   label: "Failed" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px",
      background: s.bg, color: s.color,
      fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

export default function AccountPage() {
  const { user, token, isLoading, logout } = useAuth();
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
    if (isClient && !isLoading && !user) router.push("/login?next=%2Faccount");
  }, [user, isLoading, router, isClient]);

  if (!isClient || isLoading || !user) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading your account...
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <section className="account-shell">
      <div className="account-top-card">
        <div className="account-top-left">
          <div className="account-avatar">{initials}</div>
          <div>
            <span className="hero-tag">My Account</span>
            <h1 className="page-title account-title">{user.firstName} {user.lastName}</h1>
            <p className="text-secondary">{user.email}</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={logout}>Sign Out</button>
      </div>

      <div className="account-layout">
        {/* Sidebar */}
        <aside className="account-panel account-profile-panel">
          <h3 className="account-panel-title">Profile</h3>
          <div className="account-field">
            <span className="account-field-label">Full Name</span>
            <strong>{user.firstName} {user.lastName}</strong>
          </div>
          <div className="account-field">
            <span className="account-field-label">Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="account-field">
            <span className="account-field-label">Member Since</span>
            <strong>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </div>

          <hr className="divider" />

          <h3 className="account-panel-title">Saved Addresses</h3>
          {user.addresses && user.addresses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {user.addresses.map((addr, i) => (
                <div key={i} className="account-address-item">
                  {(addr.first_name || addr.last_name) && (
                    <p className="account-address-name">{[addr.first_name, addr.last_name].filter(Boolean).join(" ")}</p>
                  )}
                  {addr.address_1 && <p className="account-address-line">{addr.address_1}</p>}
                  <p className="account-address-line">
                    {[addr.city, addr.postal_code].filter(Boolean).join(", ")}
                  </p>
                  {addr.country_code && (
                    <p className="account-address-country">{addr.country_code.toUpperCase()}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: "0.84rem" }}>No saved addresses yet. Check &ldquo;Save address&rdquo; at checkout to save one.</p>
          )}

          <hr className="divider" />

          <h3 className="account-panel-title">Security</h3>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)", fontSize: "0.84rem" }}>Update your account password.</p>
          <Link href="/account/change-password" className="btn btn-outline btn-full">
            Change Password
          </Link>
        </aside>

        {/* Orders */}
        <div className="account-panel">
          <h2 className="account-panel-title account-orders-heading">
            Order History
            {orders.length > 0 && (
              <span style={{ marginLeft: "8px", fontWeight: 400, color: "var(--text-muted)" }}>
                ({orders.length})
              </span>
            )}
          </h2>

          {isLoadingOrders ? (
            <div className="account-empty-state">
              <div className="spinner" />
              <p>Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon" style={{ fontSize: "2rem", color: "var(--border)" }}>📦</div>
              <h3>No orders yet</h3>
              <p className="text-muted">When you place orders, they will appear here.</p>
              <Link href="/products" className="btn btn-secondary">Start Shopping</Link>
            </div>
          ) : (
            <div className="account-orders-list">
              {orders.map((order) => (
                <div key={order.id} className="account-order-card">
                  {/* Order header */}
                  <div className="account-order-head">
                    <div>
                      <p className="account-order-id">Order #{order.displayId || order.id.slice(-8).toUpperCase()}</p>
                      <p className="account-order-date">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="account-order-right">
                      <p className="account-order-total">{formatMoney(order.totalInCents, order.currencyCode)}</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <StatusPill status={order.status} />
                        {order.payment?.status && <StatusPill status={order.payment.status} />}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="account-order-items-list">
                    {order.items.map((item, i) => (
                      <div key={item.id || i} className="account-order-item-row">
                        <div className="account-order-item-img">
                          {item.image ? (
                            <Image src={item.image} alt={item.title || "Product"} width={48} height={48}
                              style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                          ) : (
                            <span className="account-order-item-initial">{(item.title || "P")[0]}</span>
                          )}
                        </div>
                        <div className="account-order-item-info">
                          <p className="account-order-item-title">{item.title ?? "Product"}</p>
                          <p className="account-order-item-meta">
                            Qty: {item.quantity}
                            {item.size ? ` · ${item.size}` : ""}
                            {item.color ? ` · ${item.color}` : ""}
                          </p>
                        </div>
                        <p className="account-order-item-price">
                          {formatMoney(item.unitPriceInCents * item.quantity, order.currencyCode)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.tracking?.trackingNumber && (
                    <div className="account-order-tracking">
                      <span>Tracking:</span>
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
                  <div className="account-order-actions">
                    <Link href={`/order/${order.id}`} className="btn btn-secondary">View Order</Link>
                    {(order.eligibility?.canReturn || order.eligibility?.canExchange) && (
                      <Link href={`/order/${order.id}`} className="btn btn-outline">Return / Exchange</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
