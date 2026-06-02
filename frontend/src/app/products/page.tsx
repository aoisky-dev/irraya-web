"use client";

import { useEffect, useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { sampleProducts } from "@/lib/mock-data";
import { config } from "@/lib/config";

type SortOption = "newest" | "price-asc" | "price-desc";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    fetch(`${config.backendBaseUrl}/products`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setProducts)
      .catch(() => setProducts(sampleProducts))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ["all", ...cats];
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

    switch (sortBy) {
      case "price-asc":
        result = [...result].sort(
          (a, b) => (a.variants[0]?.priceInCents ?? 0) - (b.variants[0]?.priceInCents ?? 0)
        );
        break;
      case "price-desc":
        result = [...result].sort(
          (a, b) => (b.variants[0]?.priceInCents ?? 0) - (a.variants[0]?.priceInCents ?? 0)
        );
        break;
      default:
        break;
    }

    return result;
  }, [products, activeCategory, sortBy]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading products...
      </div>
    );
  }

  return (
    <section>
      <h1 className="page-title">Shop All</h1>
      <p className="page-subtitle">
        Browse our curated collection of premium fashion essentials.
      </p>

      {/* Filter & Sort Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
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

      {/* Results count */}
      <p className="results-count">
        {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "product" : "products"}
        {activeCategory !== "all" && ` in ${activeCategory}`}
      </p>

      {/* Product Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="cart-empty">
          <h2>No products found</h2>
          <p>Try selecting a different category.</p>
        </div>
      ) : (
        <div className="grid">
          {filteredAndSorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
