"use client";

import { useState, useEffect } from "react";
import { adminGetSaleConfig, adminSetSaleConfig, type SaleConfig } from "@/lib/api/sale";
import { useAuth } from "@/components/AuthProvider";

export default function AdminSalePage() {
  const { token } = useAuth();
  const [sale, setSale] = useState<SaleConfig>({ id: 0, name: "Global Sale", active: false, discountPct: 0, label: "", productIds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    adminGetSaleConfig(token)
      .then((cfg) => setSale({ ...cfg, label: cfg.label ?? "" }))
      .catch(() => setMessage({ type: "error", text: "Failed to load sale config." }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await adminSetSaleConfig(token, {
        active: sale.active,
        discountPct: sale.discountPct,
        label: sale.label || undefined
      });
      setSale({ ...updated, label: updated.label ?? "" });
      setMessage({ type: "success", text: "Sale settings saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save sale config." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-content">
        <header className="admin-header"><h1 className="admin-title">Sale Management</h1></header>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  const exampleOriginal = 4500;
  const exampleSale = sale.active && sale.discountPct > 0
    ? Math.round(exampleOriginal * (1 - sale.discountPct / 100))
    : null;

  return (
    <div className="admin-content">
      <header className="admin-header">
        <h1 className="admin-title">Sale Management</h1>
        <p className="admin-subtitle">
          Set a global discount that applies to all product prices automatically.
          This is separate from promo codes — the discounted price is shown directly on product listings.
        </p>
      </header>

      <form onSubmit={handleSave} style={{ maxWidth: 540 }}>
        <div className="admin-stat-card" style={{ marginBottom: "var(--space-xl)" }}>

          {/* Active toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Sale Active</p>
              <p className="text-muted" style={{ fontSize: "0.84rem" }}>
                When on, all product prices show the discounted price with the original struck through.
              </p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 48, height: 26, flexShrink: 0, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={sale.active}
                onChange={(e) => setSale((s) => ({ ...s, active: e.target.checked }))}
                style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
              />
              <span style={{
                position: "absolute", inset: 0, borderRadius: 13,
                background: sale.active ? "var(--accent, #7c3aed)" : "var(--border)",
                transition: "background 0.2s"
              }} />
              <span style={{
                position: "absolute", top: 3, left: sale.active ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)"
              }} />
            </label>
          </div>

          {/* Discount percentage */}
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Discount Percentage
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={sale.discountPct}
                onChange={(e) => setSale((s) => ({ ...s, discountPct: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                style={{ width: 100 }}
              />
              <span className="text-muted">%</span>
            </div>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>
              E.g. 10 means 10% off every product.
            </p>
          </div>

          {/* Label */}
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Sale Label <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder={`${sale.discountPct || 10}% OFF`}
              value={sale.label ?? ""}
              onChange={(e) => setSale((s) => ({ ...s, label: e.target.value }))}
              className="form-input"
            />
            <p className="text-muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>
              Shown on product cards and detail pages. Defaults to "{sale.discountPct || 10}% OFF" if blank.
            </p>
          </div>

          {/* Preview */}
          {sale.discountPct > 0 && (
            <div style={{
              padding: "14px 16px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              fontSize: "0.88rem",
              marginBottom: "var(--space-lg)"
            }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Price Preview</p>
              <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {sale.active && exampleSale ? (
                  <>
                    <span style={{ color: "var(--accent-warm, #e11d48)", fontWeight: 700, fontSize: "1.1rem" }}>
                      ₹{exampleSale.toLocaleString("en-IN")}
                    </span>
                    <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      ₹{exampleOriginal.toLocaleString("en-IN")}
                    </span>
                    <span style={{ background: "var(--accent-warm, #e11d48)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      {sale.label || `${sale.discountPct}% OFF`}
                    </span>
                  </>
                ) : (
                  <span>₹{exampleOriginal.toLocaleString("en-IN")} (sale not active)</span>
                )}
              </p>
            </div>
          )}
        </div>

        {message && (
          <p style={{
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: "var(--space-md)",
            fontSize: "0.88rem",
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b"
          }}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving…" : "Save Sale Settings"}
        </button>
      </form>
    </div>
  );
}
