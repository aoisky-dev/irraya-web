"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { IconSearch, IconX, IconArrowRight } from "@/components/Icons";
import type { Product } from "@/lib/types";
import {
  buildCatalogFacets,
  filterProducts,
  searchProducts,
  sortProducts,
  type CatalogSortOption,
} from "@/lib/catalog";

const POPULAR_SEARCH_TERMS = ["Dresses", "Co-ords", "Tops", "Trousers", "Outerwear", "Sale"];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sortBy, setSortBy] = useState<CatalogSortOption>(
    (searchParams.get("sort") as CatalogSortOption) || "popular"
  );

  useEffect(() => {
    getProducts({ limit: 200 })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Keep query in sync if URL changes externally
  useEffect(() => {
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl);
      setDebouncedQuery(queryFromUrl);
    }
  }, [queryFromUrl]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    else params.delete("q");
    if (category) params.set("category", category);
    else params.delete("category");
    if (sortBy !== "popular") params.set("sort", sortBy);
    else params.delete("sort");
    router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });

    if (debouncedQuery.trim() && typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("irraya_search_history") ?? "[]") as string[];
      localStorage.setItem(
        "irraya_search_history",
        JSON.stringify([debouncedQuery.trim(), ...history.filter((item) => item !== debouncedQuery.trim())].slice(0, 10))
      );
    }
  }, [category, debouncedQuery, router, searchParams, sortBy]);

  const searchedProducts = useMemo(() => searchProducts(products, debouncedQuery), [products, debouncedQuery]);
  const facets = useMemo(() => buildCatalogFacets(searchedProducts), [searchedProducts]);
  const filteredProducts = useMemo(() => filterProducts(searchedProducts, { category }), [searchedProducts, category]);
  const results = useMemo(() => sortProducts(filteredProducts, sortBy), [filteredProducts, sortBy]);
  const emptyRecommendations = useMemo(() => sortProducts(products, "popular").slice(0, 8), [products]);

  const handlePillClick = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    setCategory("");
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("");
  };

  return (
    <div style={{ padding: "var(--space-xl) 0 var(--space-4xl)" }}>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />

      {/* Search Page Header */}
      <div className="search-page-header">
        <div style={{ marginBottom: "var(--space-md)" }}>
          <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>
            The Wardrobe Search
          </span>
          {debouncedQuery.trim() ? (
            <h1
              className="section-title"
              style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", margin: "var(--space-xs) 0" }}
            >
              Results for{" "}
              <span style={{ color: "var(--accent-burgundy, #712119)" }}>“{debouncedQuery}”</span>
            </h1>
          ) : (
            <h1
              className="section-title"
              style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", margin: "var(--space-xs) 0" }}
            >
              Search Collection
            </h1>
          )}
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: 0 }}>
            {isLoading
              ? "Loading collection..."
              : debouncedQuery.trim()
              ? `Showing ${results.length} ${results.length === 1 ? "piece" : "pieces"} matching your search`
              : `Explore ${products.length} curated slow-fashion silhouettes`}
          </p>
        </div>

        {/* Elevated Search Bar */}
        <form
          action="/search"
          method="GET"
          onSubmit={(event) => {
            event.preventDefault();
            setDebouncedQuery(query);
          }}
          className="search-page-bar"
        >
          <IconSearch size={22} style={{ color: "var(--accent-burgundy, #712119)", flexShrink: 0 }} />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-page-input"
            placeholder="Search by silhouette, style, fabric, or color..."
            aria-label="Search products"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="search-page-clear"
              aria-label="Clear search input"
            >
              <IconX size={18} />
            </button>
          )}
          <button
            type="submit"
            className="btn"
            style={{ padding: "0.55rem 1.4rem", fontSize: "0.76rem" }}
          >
            Search
          </button>
        </form>

        {/* Quick Trending Suggestions */}
        <div className="search-pills-row">
          <span className="search-pill-label">Popular:</span>
          {POPULAR_SEARCH_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              className={`search-pill ${debouncedQuery.toLowerCase() === term.toLowerCase() ? "active" : ""}`}
              onClick={() => handlePillClick(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Sort Bar */}
      {!isLoading && searchedProducts.length > 0 && (
        <div className="filter-bar">
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${!category ? "active" : ""}`}
              onClick={() => setCategory("")}
            >
              All ({searchedProducts.length})
            </button>
            {facets.categories.map((facet) => (
              <button
                key={facet.value}
                type="button"
                className={`filter-tab ${category === facet.value ? "active" : ""}`}
                onClick={() => setCategory(category === facet.value ? "" : facet.value)}
              >
                {facet.value} ({facet.count})
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
              Sort by:
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as CatalogSortOption)}
              aria-label="Sort products"
            >
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      )}

      {/* Content States */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "var(--space-4xl) 0" }}>
          <div className="spinner" style={{ margin: "0 auto var(--space-md)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Curating collection results...</p>
        </div>
      ) : results.length === 0 ? (
        /* Elevated Empty State */
        <div>
          <div className="search-empty-box">
            <div className="search-empty-icon">
              <IconSearch size={26} />
            </div>
            <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "var(--space-sm)" }}>
              No pieces found for “{debouncedQuery || "your selection"}”
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                maxWidth: 480,
                margin: "0 auto var(--space-xl)",
                fontSize: "0.92rem",
                lineHeight: 1.6,
              }}
            >
              We couldn’t find any pieces matching your search. Try checking your spelling, using broader terms, or explore our curated popular picks below.
            </p>
            <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn"
                onClick={handleClear}
              >
                Clear Search
              </button>
              <Link href="/products" className="btn btn-outline">
                Browse All Products
              </Link>
            </div>
          </div>

          {/* Fallback Recommendations */}
          {emptyRecommendations.length > 0 && (
            <div>
              <div className="section-header">
                <div>
                  <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>Handpicked</span>
                  <h2 className="section-title">Popular Pieces You May Like</h2>
                </div>
                <Link href="/products" className="section-link">
                  View full catalog →
                </Link>
              </div>
              <div className="grid">
                {emptyRecommendations.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Grid */
        <div className="grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "var(--space-4xl) 0", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto var(--space-md)" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

