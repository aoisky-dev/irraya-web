"use client";

import Link from "next/link";
import { useCompare } from "@/components/CompareProvider";
import { formatMoney } from "@/lib/format";

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) {
    return (
      <div className="cart-empty" style={{ padding: "var(--space-4xl) 0" }}>
        <h1 className="text-3xl font-bold mb-4">Compare Products</h1>
        <p className="text-gray-600 mb-8">You haven't added any products to compare yet.</p>
        <Link href="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-2xl) 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <h1 className="text-3xl font-bold">Compare Products</h1>
        <button onClick={clearCompare} className="btn btn-outline text-sm">
          Clear All
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr>
              <th style={{ width: "20%", padding: "var(--space-md)", textAlign: "left", borderBottom: "2px solid var(--border)" }}>Feature</th>
              {compareItems.map((product) => (
                <th key={product.id} style={{ width: `${80 / compareItems.length}%`, padding: "var(--space-md)", textAlign: "center", borderBottom: "2px solid var(--border)" }}>
                  <div style={{ position: "relative", marginBottom: "var(--space-sm)" }}>
                    {product.image ? (
                      <img src={product.image} alt={product.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                    ) : (
                      <div className="card-image-placeholder" style={{ height: "200px" }}>✦</div>
                    )}
                    <button 
                      onClick={() => removeFromCompare(product.id)}
                      style={{ position: "absolute", top: "8px", right: "8px", background: "white", borderRadius: "50%", width: "24px", height: "24px", border: "none", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    >
                      ✕
                    </button>
                  </div>
                  <Link href={`/products/${product.handle}`} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                    <h3 style={{ fontSize: "1.1rem" }}>{product.title}</h3>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Price</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                  {formatMoney(product.variants[0]?.priceInCents ?? 0, "inr")}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Category</td>
              <td style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)", textTransform: "capitalize" }} colSpan={compareItems.length}>
                {compareItems.map(p => p.category).join(" | ")}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Rating</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "var(--accent)" }}>★</span>
                    {product.rating || 4.8} ({product.reviewsCount || 0})
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Available Colors</td>
              {compareItems.map((product) => {
                const colors = [...new Set(product.variants.map(v => v.color))];
                return (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {colors.join(", ")}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Available Sizes</td>
              {compareItems.map((product) => {
                const sizes = [...new Set(product.variants.map(v => v.size))];
                return (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {sizes.join(", ")}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
