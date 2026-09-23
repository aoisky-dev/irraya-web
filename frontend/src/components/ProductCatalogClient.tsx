"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/api/products";
import { buildCatalogFacets, filterProducts, sortProducts, type CatalogSortOption } from "@/lib/catalog";

export function ProductCatalogClient({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter states
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeColor, setActiveColor] = useState("");
  const [activeSize, setActiveSize] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [sortBy, setSortBy] = useState<CatalogSortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    // Only re-fetch if we don't have initial server-side data
    if (initialProducts.length > 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const categoryFromQuery = searchParams.get("category")?.trim().toLowerCase();
    setActiveCategory(categoryFromQuery || "all");
    setActiveColor(searchParams.get("color") ?? "");
    setActiveSize(searchParams.get("size") ?? "");
    setMinPrice(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "");
    setMaxPrice(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "");
    setInStockOnly(searchParams.get("stock") === "in");
    setSortBy((searchParams.get("sort") as CatalogSortOption) || "newest");
  }, [searchParams]);

  const updateQuery = (updates: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === false || value === "all") params.delete(key);
      else params.set(key, String(value));
    }
    router.replace(`/products${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const facets = useMemo(() => buildCatalogFacets(products), [products]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      category: activeCategory,
      color: activeColor,
      size: activeSize,
      minPrice: typeof minPrice === "number" ? minPrice : undefined,
      maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
      inStockOnly
    });
  }, [products, activeCategory, activeColor, activeSize, minPrice, maxPrice, inStockOnly]);

  const sortedProducts = useMemo(() => sortProducts(filteredProducts, sortBy), [filteredProducts, sortBy]);
  const recommendedProducts = useMemo(() => sortProducts(products, "popular").slice(0, 4), [products]);

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

      <div className="catalog-layout">
        
        {/* Main Content Area */}
        <div style={{ flexGrow: 1 }}>
          <div className="filter-bar" ref={filterRef} style={{ marginTop: 0, position: "relative" }}>
            <div className="results-count" style={{ margin: 0, display: "flex", alignItems: "center", gap: "1rem" }}>
              <button 
                className="btn btn-outline filter-toggle-btn" 
                onClick={() => setShowFilters(!showFilters)}
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem", display: "inline-flex" }}
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
              
              <div className={`filter-dropdown-container ${showFilters ? "open" : ""}`}>
                <button className="filter-close-btn" onClick={() => setShowFilters(false)} aria-label="Close filters">×</button>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "var(--space-md)" }}>Filters</h2>
                
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Category</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {[{ value: "all", count: products.length }, ...facets.categories].map((cat) => (
                      <label key={cat.value} style={{ display: "flex", gap: "0.5rem", cursor: "pointer", textTransform: "capitalize" }}>
                        <input type="radio" name="category" checked={activeCategory === cat.value.toLowerCase()} onChange={() => updateQuery({ category: cat.value.toLowerCase() })} />
                        {cat.value} <span className="text-muted">({cat.count})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-md)" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Color</h3>
                  <select className="input" value={activeColor} onChange={(e) => updateQuery({ color: e.target.value })} style={{ width: "100%" }}>
                    <option value="">All Colors</option>
                    {facets.colors.map(c => <option key={c.value} value={c.value}>{c.value} ({c.count})</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: "var(--space-md)" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Size</h3>
                  <select className="input" value={activeSize} onChange={(e) => updateQuery({ size: e.target.value })} style={{ width: "100%" }}>
                    <option value="">All Sizes</option>
                    {facets.sizes.map(s => <option key={s.value} value={s.value}>{s.value} ({s.count})</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: "var(--space-md)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Min ₹</h3>
                    <input type="number" className="input" value={minPrice} onChange={(e) => updateQuery({ minPrice: e.target.value ? Number(e.target.value) : null })} style={{ width: "100%" }} />
                  </div>
                  <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-sm)" }}>Max ₹</h3>
                  <input
                    type="number" 
                    className="input" 
                    placeholder={String(Math.ceil(facets.priceRange.max / 100))}
                    value={maxPrice}
                    onChange={(e) => updateQuery({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                    style={{ width: "100%" }}
                  />
                  </div>
                </div>

                <label style={{ display: "flex", gap: "0.5rem", cursor: "pointer", marginBottom: "var(--space-md)" }}>
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => updateQuery({ stock: e.target.checked ? "in" : null })} />
                  In stock only
                </label>

                <button 
                  className="btn btn-outline btn-full" 
                  onClick={() => { router.replace("/products", { scroll: false }); setShowFilters(false); }}
                >
                  Clear Filters
                </button>
              </div>
              <span>{isLoading ? "Loading..." : `${sortedProducts.length} ${sortedProducts.length === 1 ? "product" : "products"}`}</span>
            </div>
            
            <div className="filter-sort">
              <label htmlFor="sort-select" className="sr-only">Sort by</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => updateQuery({ sort: e.target.value })}
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
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
              {recommendedProducts.length > 0 && (
                <div style={{ marginTop: "var(--space-xl)", textAlign: "left" }}>
                  <h3 style={{ marginBottom: "var(--space-md)" }}>Recommended picks</h3>
                  <div className="grid">
                    {recommendedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                  </div>
                </div>
              )}
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
