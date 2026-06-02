"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-layout" style={{ alignItems: "center", justifyContent: "center", padding: "var(--space-2xl)" }}>
        <div className="admin-stat-card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <h2 className="admin-title" style={{ fontSize: "1.5rem", marginBottom: "var(--space-sm)" }}>Admin Login</h2>
          <p className="admin-subtitle" style={{ marginBottom: "var(--space-xl)" }}>Please sign in to access the dashboard.</p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <input 
              type="password" 
              placeholder="Password (hint: admin123)" 
              className="input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p style={{ color: "var(--error)", fontSize: "0.85rem", textAlign: "left" }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "8px" }}>Login</button>
            <Link href="/" className="btn btn-outline btn-full">Return to Store</Link>
          </form>
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
