"use client";

import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

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
