"use client";

import Link from "next/link";
import { useCompare } from "@/components/CompareProvider";
import { formatMoney } from "@/lib/format";

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare, isSyncing, syncError } = useCompare();

  const getPriceRange = (product: typeof compareItems[number]) => {
    const prices = product.variants.map((variant) => variant.priceInCents).filter((price) => price > 0);
    if (prices.length === 0) return "Price unavailable";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatMoney(min, "inr") : `${formatMoney(min, "inr")} – ${formatMoney(max, "inr")}`;
  };

  const getStockLabel = (product: typeof compareItems[number]) => {
    const totalStock = product.variants.reduce((sum, variant) => sum + Math.max(variant.stock, 0), 0);
    if (totalStock === 0) return { label: "Out of stock", color: "var(--error)" };
    if (totalStock <= 5) return { label: `Low stock (${totalStock})`, color: "var(--warning, #b45309)" };
    return { label: `In stock (${totalStock})`, color: "var(--success, green)" };
  };

  const formatVariantAvailability = (product: typeof compareItems[number], key: "size" | "color") => {
    const groups = new Map<string, number>();
    for (const variant of product.variants) {
      groups.set(variant[key], (groups.get(variant[key]) ?? 0) + Math.max(variant.stock, 0));
    }
    return [...groups.entries()].map(([label, stock]) => `${label}${stock <= 0 ? " (out)" : ""}`).join(", ") || "—";
  };

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
        <div>
          <h1 className="text-3xl font-bold">Compare Products</h1>
          <p className="text-muted" style={{ marginTop: "var(--space-xs)" }}>
            {compareItems.length}/4 products selected {isSyncing ? "· Syncing..." : ""}
          </p>
          {syncError && <p style={{ color: "var(--error)", marginTop: "var(--space-xs)" }}>{syncError}</p>}
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <Link href="/products" className="btn btn-secondary text-sm">Add Products</Link>
          <button onClick={clearCompare} className="btn btn-outline text-sm">
            Clear All
          </button>
        </div>
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
                  {getPriceRange(product)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Category</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)", textTransform: "capitalize" }}>
                  {product.category}
                </td>
              ))}
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
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Availability</td>
              {compareItems.map((product) => {
                const stock = getStockLabel(product);
                return (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)", color: stock.color, fontWeight: 600 }}>
                    {stock.label}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Variants</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                  {product.variants.length} variants
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Colors by stock</td>
              {compareItems.map((product) => {
                return (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {formatVariantAvailability(product, "color")}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Sizes by stock</td>
              {compareItems.map((product) => {
                return (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {formatVariantAvailability(product, "size")}
                  </td>
                );
              })}
            </tr>
            {["material", "fit", "care"].map((key) => (
              <tr key={key}>
                <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500, textTransform: "capitalize" }}>{key}</td>
                {compareItems.map((product) => (
                  <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {product.metadata?.[key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Description</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "left", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                  {product.description || "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Action</td>
              {compareItems.map((product) => (
                <td key={product.id} style={{ padding: "var(--space-md)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                  <Link href={`/products/${product.handle}`} className="btn btn-primary text-sm">View Product</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
