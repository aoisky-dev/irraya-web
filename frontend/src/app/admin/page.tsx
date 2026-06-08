"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { config } from "@/lib/config";
import type { Order } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

type Stats = {
  totalOrders: number;
  totalRevenueInCents: number;
  averageOrderValueInCents: number;
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { token, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`${config.backendBaseUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => res.json()),
      fetch(`${config.backendBaseUrl}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => res.json())
    ])
      .then(([ordersData, statsData]) => {
        if (ordersData.error || statsData.error) throw new Error(ordersData.error || statsData.error || "Failed to load admin data");
        setOrders(ordersData);
        setStats(statsData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [token, user, isAuthLoading, router]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-empty">
        <h2 style={{ color: "var(--error)" }}>Dashboard Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <header className="admin-header">
        <h1 className="admin-title">Dashboard Overview</h1>
        <p className="admin-subtitle">Welcome back. Here is what is happening today.</p>
      </header>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3>Total Revenue</h3>
            <div className="value">{formatMoney(stats.totalRevenueInCents, "inr")}</div>
          </div>
          <div className="admin-stat-card">
            <h3>Total Orders</h3>
            <div className="value">{stats.totalOrders}</div>
          </div>
          <div className="admin-stat-card">
            <h3>Average Order Value</h3>
            <div className="value">{formatMoney(stats.averageOrderValueInCents, "inr")}</div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Recent Orders</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="admin-empty">No orders found.</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="text-secondary" style={{ fontFamily: "monospace" }}>
                        {order.id.replace("ord_", "…")}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items.length}</td>
                    <td style={{ fontWeight: 500 }}>
                      {formatMoney(order.totalInCents, "inr")}
                    </td>
                    <td>
                      <span className={`badge ${order.status === "confirmed" ? "badge-success" : "badge-warning"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
