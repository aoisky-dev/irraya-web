"use client";

import { config } from "@/lib/config";

export default function AdminDashboardPage() {

  return (
    <div className="admin-content">
      <header className="admin-header">
        <h1 className="admin-title">Medusa Admin</h1>
        <p className="admin-subtitle">
          The custom dashboard is deprecated in Pattern B. Use Medusa&apos;s native admin panel.
        </p>
      </header>

      <div className="admin-stat-card" style={{ maxWidth: 680 }}>
        <h3 style={{ marginBottom: "var(--space-md)" }}>Open Admin Console</h3>
        <p className="text-secondary" style={{ marginBottom: "var(--space-lg)" }}>
          Manage products, collections, discounts, orders, customers, and fulfillment directly in Medusa.
        </p>
        <a href={config.medusaAdminUrl} target="_blank" rel="noreferrer" className="btn">
          Open Medusa Admin
        </a>
        <p className="text-muted" style={{ marginTop: "var(--space-md)", fontSize: "0.85rem" }}>
          {config.medusaAdminUrl}
        </p>
      </div>

      <div className="admin-section" style={{ marginTop: "var(--space-xl)" }}>
        <div className="admin-section-header">
          <h2>Migration Note</h2>
        </div>
        <div style={{ padding: "var(--space-lg) var(--space-xl)", color: "var(--text-secondary)" }}>
          API-driven custom admin widgets were removed so the project can rely on Medusa native capabilities.
        </div>
      </div>
    </div>
  );
}
