"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";
import { getMyOrders } from "@/lib/api/orders";

export default function AccountPage() {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (token) {
      getMyOrders(token)
        .then(setOrders)
        .catch(console.error)
        .finally(() => setIsLoadingOrders(false));
    }
  }, [token]);

  useEffect(() => {
    if (isClient && !isLoading && !user) {
      router.push("/login?next=%2Faccount");
    }
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
            <span className="hero-tag">My Profile</span>
            <h1 className="page-title account-title">{user.firstName} {user.lastName}</h1>
            <p className="text-secondary">{user.email}</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Sign Out
        </button>
      </div>

      <div className="account-layout">
        <aside className="account-panel account-profile-panel">
          <h3 className="account-panel-title">Profile Details</h3>
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
            <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
          </div>

          <hr className="divider" />

          <h3 className="account-panel-title">Saved Addresses</h3>
          <p className="text-muted">No saved addresses yet.</p>

          <hr className="divider" />

          <h3 className="account-panel-title">Change Password</h3>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>Update your password using your current password.</p>
          <Link href="/account/change-password" className="btn btn-outline btn-full">
            Change Password
          </Link>
        </aside>

        <div className="account-panel">
          <h2 className="account-panel-title account-orders-heading">Order History</h2>

          {isLoadingOrders ? (
            <div className="account-empty-state">
              <div className="spinner" />
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">[]</div>
              <h3>No orders yet</h3>
              <p className="text-muted">When you place orders, they will appear here.</p>
              <Link href="/products" className="btn btn-secondary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="account-orders-list">
              {orders.map((order) => (
                <div key={order.id} className="account-order-card">
                  <div className="account-order-head">
                    <div>
                      <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                      <div className="text-muted account-order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-muted account-order-date">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        {order.tracking?.trackingNumber ? ` · Tracking ${order.tracking.trackingNumber}` : ""}
                      </div>
                    </div>
                    <div className="account-order-right">
                      <strong>{formatMoney(order.totalInCents, order.currencyCode)}</strong>
                      <span className="badge account-order-badge">{order.status.toUpperCase()}</span>
                      {order.payment?.status && <span className="badge account-order-badge">PAYMENT {order.payment.status.toUpperCase()}</span>}
                    </div>
                  </div>
                  <div className="account-order-items">
                    {order.items.map((item, i) => (
                      <div key={item.id || i} className="account-order-item-thumb" title={item.title}>{item.title?.[0] ?? "#"}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)", flexWrap: "wrap" }}>
                    <Link href={`/order/${order.id}`} className="btn btn-secondary">
                      View details
                    </Link>
                    {(order.eligibility?.canReturn || order.eligibility?.canExchange) && (
                      <Link href={`/order/${order.id}`} className="btn btn-outline">
                        Return or exchange
                      </Link>
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
