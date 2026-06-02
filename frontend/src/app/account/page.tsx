"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading && !user) {
      router.push("/login");
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
    <section>
      <div className="account-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <div className="account-avatar" style={{ 
            width: "60px", 
            height: "60px", 
            borderRadius: "50%", 
            background: "var(--accent)", 
            color: "var(--bg-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}>
            {initials}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-secondary">{user.email}</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Sign Out
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: "var(--space-2xl)", marginTop: "var(--space-3xl)" }}>
        
        {/* Profile Sidebar */}
        <div>
          <div className="review-card" style={{ padding: "var(--space-xl)", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ marginBottom: "var(--space-lg)" }}>Profile Details</h3>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="text-muted" style={{ fontSize: "0.85rem", display: "block" }}>Full Name</label>
              <strong>{user.firstName} {user.lastName}</strong>
            </div>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="text-muted" style={{ fontSize: "0.85rem", display: "block" }}>Email</label>
              <strong>{user.email}</strong>
            </div>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="text-muted" style={{ fontSize: "0.85rem", display: "block" }}>Member Since</label>
              <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
            </div>
            
            <hr className="divider" />
            
            <h3 style={{ marginBottom: "var(--space-md)" }}>Saved Addresses</h3>
            <div style={{ padding: "var(--space-md)", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
              <strong>Home</strong>
              <p className="text-muted" style={{ fontSize: "0.9rem", margin: "4px 0" }}>
                123 Fashion Ave<br/>
                New York, NY 10001
              </p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div>
          <h2 style={{ marginBottom: "var(--space-xl)" }}>Order History</h2>
          
          <div className="review-card" style={{ padding: "var(--space-xl)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>📦</div>
            <h3>No orders yet</h3>
            <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
              When you place orders, they will appear here.
            </p>
            <Link href="/products" className="btn btn-secondary">
              Start Shopping
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
