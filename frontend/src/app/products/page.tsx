"use client";

import { useEffect, useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/lib/types";
import { sampleProducts } from "@/lib/mock-data";
import { config } from "@/lib/config";

type SortOption = "newest" | "price-asc" | "price-desc";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeColor, setActiveColor] = useState("");
  const [activeSize, setActiveSize] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    setIsLoading(true);
    // Build query params
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.append("category", activeCategory);
    if (activeColor) params.append("color", activeColor);
    if (activeSize) params.append("size", activeSize);
    if (maxPrice) params.append("maxPrice", (maxPrice * 100).toString()); // convert dollars to cents

    fetch(`${config.backendBaseUrl}/products?${params.toString()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setProducts)
      .catch(() => {
        // Simple client-side fallback if backend fails
        let fallback = [...sampleProducts];
        if (activeCategory !== "all") fallback = fallback.filter(p => p.category === activeCategory);
        if (activeColor) fallback = fallback.filter(p => p.variants.some(v => v.color.toLowerCase() === activeColor.toLowerCase()));
        if (activeSize) fallback = fallback.filter(p => p.variants.some(v => v.size.toLowerCase() === activeSize.toLowerCase()));
        if (maxPrice) fallback = fallback.filter(p => p.variants.some(v => v.priceInCents <= Number(maxPrice) * 100));
        setProducts(fallback);
      })
      .finally(() => setIsLoading(false));
  }, [activeCategory, activeColor, activeSize, maxPrice]);

  const categories = useMemo(() => ["all", "t-shirts", "hoodies", "dresses", "pants", "outerwear"], []);
  const colors = useMemo(() => ["", "Black", "White", "Navy", "Charcoal", "Beige", "Tan", "Olive", "Burgundy"], []);
  const sizes = useMemo(() => ["", "S", "M", "L", "XL", "30", "32", "34"], []);

  const sortedProducts = useMemo(() => {
    let result = [...products];
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => (a.variants[0]?.priceInCents ?? 0) - (b.variants[0]?.priceInCents ?? 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.variants[0]?.priceInCents ?? 0) - (a.variants[0]?.priceInCents ?? 0));
        break;
    }
    return result;
  }, [products, sortBy]);

  return (
    <section>
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Shop" }
      ]} />
      <h1 className="page-title">Shop All</h1>
      <p className="page-subtitle">
        Browse our curated collection of premium fashion essentials.
      </p>

      <div style={{ display: "flex", gap: "var(--space-2xl)", marginTop: "var(--space-xl)", alignItems: "flex-start" }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: "250px", flexShrink: 0, padding: "var(--space-lg)", background: "var(--surface)", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "var(--space-md)" }}>Filters</h2>
          
          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {categories.map((cat) => (
                <label key={cat} style={{ display: "flex", gap: "0.5rem", cursor: "pointer", textTransform: "capitalize" }}>
                  <input type="radio" name="category" checked={activeCategory === cat} onChange={() => setActiveCategory(cat)} />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Color</h3>
            <select className="input" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} style={{ width: "100%" }}>
              <option value="">All Colors</option>
              {colors.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Size</h3>
            <select className="input" value={activeSize} onChange={(e) => setActiveSize(e.target.value)} style={{ width: "100%" }}>
              <option value="">All Sizes</option>
              {sizes.filter(s => s).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Max Price ($)</h3>
            <input 
              type="number" 
              className="input" 
              placeholder="e.g. 100" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")} 
              style={{ width: "100%" }}
            />
          </div>
          
          <button 
            className="btn btn-outline btn-full" 
            onClick={() => { setActiveCategory("all"); setActiveColor(""); setActiveSize(""); setMaxPrice(""); }}
          >
            Clear Filters
          </button>
        </aside>

        {/* Main Content Area */}
        <div style={{ flexGrow: 1 }}>
          <div className="filter-bar" style={{ marginTop: 0 }}>
            <div className="results-count" style={{ margin: 0 }}>
              {isLoading ? "Loading..." : `${sortedProducts.length} ${sortedProducts.length === 1 ? "product" : "products"}`}
            </div>
            
            <div className="filter-sort">
              <label htmlFor="sort-select" className="sr-only">Sort by</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading" style={{ height: "400px" }}>
              <div className="spinner" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
              <h2>No products found</h2>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
