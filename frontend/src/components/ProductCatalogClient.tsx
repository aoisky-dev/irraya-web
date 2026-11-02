"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/api/products";
import { buildCatalogFacets, filterProducts, sortProducts, type CatalogSortOption } from "@/lib/catalog";

function PriceRangeSlider({
  minBound,
  maxBound,
  currentMin,
  currentMax,
  onCommit,
}: {
  minBound: number;
  maxBound: number;
  currentMin: number | "";
  currentMax: number | "";
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const [localMin, setLocalMin] = useState<number>(typeof currentMin === "number" ? currentMin : minBound);
  const [localMax, setLocalMax] = useState<number>(typeof currentMax === "number" ? currentMax : maxBound);

  useEffect(() => {
    setLocalMin(typeof currentMin === "number" ? currentMin : minBound);
  }, [currentMin, minBound]);

  useEffect(() => {
    setLocalMax(typeof currentMax === "number" ? currentMax : maxBound);
  }, [currentMax, maxBound]);

  const range = Math.max(1, maxBound - minBound);
  const leftPercent = Math.max(0, Math.min(100, ((localMin - minBound) / range) * 100));
  const rightPercent = Math.max(0, Math.min(100, ((localMax - minBound) / range) * 100));

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - 50);
    setLocalMin(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + 50);
    setLocalMax(val);
  };

  const handleCommit = () => {
    const minVal = localMin <= minBound ? null : localMin;
    const maxVal = localMax >= maxBound ? null : localMax;
    onCommit(minVal, maxVal);
  };

  return (
    <div className="price-range-slider-wrapper">
      <div className="price-range-display">
        <span>₹{localMin.toLocaleString("en-IN")}</span>
        <span className="price-range-sep">—</span>
        <span>₹{localMax.toLocaleString("en-IN")}</span>
      </div>

      <div className="price-slider-container">
        <div className="price-slider-track-bg" />
        <div
          className="price-slider-track-fill"
          style={{
            left: `${leftPercent}%`,
            width: `${Math.max(0, rightPercent - leftPercent)}%`,
          }}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={50}
          value={localMin}
          onChange={handleMinChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onKeyUp={handleCommit}
          className="price-slider-input price-slider-input--left"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={50}
          value={localMax}
          onChange={handleMaxChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onKeyUp={handleCommit}
          className="price-slider-input price-slider-input--right"
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}

export function ProductCatalogClient({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeColor, setActiveColor] = useState("");
  const [activeSize, setActiveSize] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [sortBy, setSortBy] = useState<CatalogSortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory && activeCategory !== "all") count++;
    if (activeColor) count++;
    if (activeSize) count++;
    if (minPrice !== "" || maxPrice !== "") count++;
    if (inStockOnly) count++;
    return count;
  }, [activeCategory, activeColor, activeSize, minPrice, maxPrice, inStockOnly]);

  // Lock mobile body scroll when bottom sheet is open
  useEffect(() => {
    if (showFilters && typeof window !== "undefined" && window.innerWidth <= 991) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showFilters]);

  // Desktop click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth > 991 && filterRef.current && !filterRef.current.contains(event.target as Node)) {
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
  }, [initialProducts.length]);

  useEffect(() => {
    const q = searchParams.get("q") ?? searchParams.get("search") ?? "";
    setSearchQuery(q);
    const categoryFromQuery = searchParams.get("category")?.trim().toLowerCase();
    setActiveCategory(categoryFromQuery || "all");
    setActiveColor(searchParams.get("color") ?? "");
    setActiveSize(searchParams.get("size") ?? "");
    setMinPrice(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "");
    setMaxPrice(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "");
    setInStockOnly(searchParams.get("stock") === "in");
    setSortBy((searchParams.get("sort") as CatalogSortOption) || "newest");
  }, [searchParams]);

  const updateQuery = useCallback((updates: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === false || value === "all") params.delete(key);
      else params.set(key, String(value));
    }
    router.replace(`/products${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveColor("");
    setActiveSize("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    router.replace("/products", { scroll: false });
  }, [router]);

  const facets = useMemo(() => buildCatalogFacets(products), [products]);

  // Price bounds derived from facets (in Rupees)
  const priceBounds = useMemo(() => {
    const min = facets.priceRange.min > 0 ? Math.floor(facets.priceRange.min / 100) : 0;
    const max = facets.priceRange.max > 0 ? Math.ceil(facets.priceRange.max / 100) : 10000;
    const minBound = Math.floor(min / 100) * 100;
    const maxBound = Math.ceil(max / 100) * 100 || 10000;
    return { minBound, maxBound };
  }, [facets.priceRange]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      category: activeCategory,
      color: activeColor,
      size: activeSize,
      minPrice: typeof minPrice === "number" ? minPrice : undefined,
      maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
      inStockOnly,
      search: searchQuery.trim() || undefined,
    });
  }, [products, activeCategory, activeColor, activeSize, minPrice, maxPrice, inStockOnly, searchQuery]);

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

      {/* Backdrop for mobile bottom sheet */}
      <div
        className={`filter-sheet-backdrop${showFilters ? " open" : ""}`}
        onClick={() => setShowFilters(false)}
        aria-hidden="true"
      />

      <div className="catalog-layout">
        
        {/* Main Content Area */}
        <div style={{ flexGrow: 1 }}>
          <div className="filter-bar" ref={filterRef} style={{ marginTop: 0, position: "relative" }}>
            <div className="results-count" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button 
                type="button"
                className={`filter-toggle-btn btn btn-outline${activeFilterCount > 0 ? " filter-toggle-btn--active" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="filter-badge-count">{activeFilterCount}</span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="btn-clear-filters-toolbar"
                  onClick={clearAllFilters}
                  aria-label="Clear all active filters"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
              
              {/* Dropdown on desktop / Bottom Sheet on mobile */}
              <div className={`filter-dropdown-container ${showFilters ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Catalog filters">
                <div className="filter-sheet-grabber" />

                <div className="filter-sheet-header">
                  <h2>
                    <span>Filters</span>
                    {activeFilterCount > 0 && <span className="filter-badge-count">{activeFilterCount}</span>}
                  </h2>
                  <button
                    type="button"
                    className="filter-close-btn"
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                  >
                    ×
                  </button>
                </div>

                <div className="filter-sheet-body">
                  {/* Category Filter */}
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "var(--space-sm)" }}>Category</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {[{ value: "all", count: products.length }, ...facets.categories].map((cat) => (
                        <label key={cat.value} style={{ display: "flex", gap: "0.5rem", cursor: "pointer", textTransform: "capitalize", fontSize: "0.9rem" }}>
                          <input
                            type="radio"
                            name="category"
                            checked={activeCategory === cat.value.toLowerCase()}
                            onChange={() => updateQuery({ category: cat.value.toLowerCase() })}
                          />
                          {cat.value} <span className="text-muted">({cat.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "var(--space-sm)" }}>Color</h3>
                    <select
                      className="input"
                      value={activeColor}
                      onChange={(e) => updateQuery({ color: e.target.value })}
                      style={{ width: "100%", height: "38px" }}
                    >
                      <option value="">All Colors</option>
                      {facets.colors.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.value} ({c.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Filter */}
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "var(--space-sm)" }}>Size</h3>
                    <select
                      className="input"
                      value={activeSize}
                      onChange={(e) => updateQuery({ size: e.target.value })}
                      style={{ width: "100%", height: "38px" }}
                    >
                      <option value="">All Sizes</option>
                      {facets.sizes.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.value} ({s.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dual-Handle Price Range Slider */}
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "var(--space-xs)" }}>Price Range</h3>
                    <PriceRangeSlider
                      minBound={priceBounds.minBound}
                      maxBound={priceBounds.maxBound}
                      currentMin={minPrice}
                      currentMax={maxPrice}
                      onCommit={(min, max) => updateQuery({ minPrice: min, maxPrice: max })}
                    />
                  </div>

                  {/* In Stock Only */}
                  <label style={{ display: "flex", gap: "0.5rem", cursor: "pointer", alignItems: "center", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => updateQuery({ stock: e.target.checked ? "in" : null })}
                    />
                    In stock only
                  </label>
                </div>

                {/* Footer with Clear All and Apply / View Results */}
                <div className="filter-sheet-footer">
                  <button 
                    type="button"
                    className="btn btn-outline" 
                    onClick={() => {
                      clearAllFilters();
                      setShowFilters(false);
                    }}
                    style={{ fontSize: "0.85rem", padding: "8px 14px" }}
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowFilters(false)}
                    style={{ background: "#712119", borderColor: "#712119", color: "#fff", fontSize: "0.85rem", padding: "8px 14px" }}
                  >
                    View {sortedProducts.length} {sortedProducts.length === 1 ? "Product" : "Products"}
                  </button>
                </div>
              </div>

              <span>{isLoading ? "Loading..." : `${sortedProducts.length} ${sortedProducts.length === 1 ? "product" : "products"}`}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: "1 1 auto", justifyContent: "flex-end" }}>
              <div style={{ position: "relative", minWidth: "180px", maxWidth: "260px", flex: "1 1 auto" }}>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    updateQuery({ q: val || null });
                  }}
                  className="input"
                  style={{
                    width: "100%",
                    padding: "6px 28px 6px 12px",
                    fontSize: "0.85rem",
                    borderRadius: "var(--radius-sm)",
                    height: "36px"
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      updateQuery({ q: null });
                    }}
                    aria-label="Clear search"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "2px"
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="filter-sort">
                <label htmlFor="sort-select" className="sr-only">Sort by</label>
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => updateQuery({ sort: e.target.value })}
                  style={{ height: "36px" }}
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter badges row */}
          {(activeCategory !== "all" || activeColor || activeSize || minPrice !== "" || maxPrice !== "" || inStockOnly || searchQuery) && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "var(--space-md)", marginTop: "var(--space-xs)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active:</span>
              {searchQuery && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Search: "{searchQuery}"
                  <button type="button" onClick={() => { setSearchQuery(""); updateQuery({ q: null }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {activeCategory !== "all" && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px", textTransform: "capitalize" }}>
                  {activeCategory}
                  <button type="button" onClick={() => updateQuery({ category: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {activeColor && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Color: {activeColor}
                  <button type="button" onClick={() => updateQuery({ color: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {activeSize && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Size: {activeSize}
                  <button type="button" onClick={() => updateQuery({ size: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {typeof minPrice === "number" && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Min ₹{minPrice.toLocaleString("en-IN")}
                  <button type="button" onClick={() => updateQuery({ minPrice: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {typeof maxPrice === "number" && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Max ₹{maxPrice.toLocaleString("en-IN")}
                  <button type="button" onClick={() => updateQuery({ maxPrice: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              {inStockOnly && (
                <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  In stock only
                  <button type="button" onClick={() => updateQuery({ stock: null })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: "0 2px" }}>×</button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#712119",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "2px 6px"
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Skeleton loading (10 cards) */}
          {isLoading ? (
            <div className="grid">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="product-card-skeleton" aria-hidden="true">
                  <div className="skeleton-box skeleton-image" />
                  <div className="skeleton-body">
                    <div className="skeleton-box skeleton-badge" />
                    <div className="skeleton-box skeleton-title" />
                    <div className="skeleton-box skeleton-price" />
                  </div>
                </div>
              ))}
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
