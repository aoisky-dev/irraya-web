"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="admin-layout" style={{ alignItems: "center", justifyContent: "center", padding: "var(--space-2xl)" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-layout" style={{ alignItems: "center", justifyContent: "center", padding: "var(--space-2xl)" }}>
        <div className="admin-stat-card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <h2 className="admin-title" style={{ fontSize: "1.5rem", marginBottom: "var(--space-sm)" }}>Access Denied</h2>
          <p className="admin-subtitle" style={{ marginBottom: "var(--space-xl)" }}>You must be an administrator to access this page.</p>
          <Link href="/" className="btn btn-primary btn-full">Return to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Irraya Admin
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-item active">Dashboard</Link>
          <Link href="/admin" className="admin-nav-item">Orders</Link>
          <Link href="/admin" className="admin-nav-item">Products</Link>
          <Link href="/admin" className="admin-nav-item">Customers</Link>
          <hr className="admin-nav-divider" />
          <Link href="/" className="admin-nav-item">Back to Store</Link>
        </nav>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
