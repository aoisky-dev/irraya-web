"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { buildCatalogFacets, filterProducts, getSearchSuggestions, searchProducts, sortProducts, type CatalogSortOption } from "@/lib/catalog";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sortBy, setSortBy] = useState<CatalogSortOption>((searchParams.get("sort") as CatalogSortOption) || "popular");

  useEffect(() => {
    getProducts({ limit: 200 })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

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
      localStorage.setItem("irraya_search_history", JSON.stringify([debouncedQuery.trim(), ...history.filter((item) => item !== debouncedQuery.trim())].slice(0, 10)));
    }
  }, [category, debouncedQuery, router, searchParams, sortBy]);

  const facets = useMemo(() => buildCatalogFacets(products), [products]);
  const searchedProducts = useMemo(() => searchProducts(products, debouncedQuery), [products, debouncedQuery]);
  const filteredProducts = useMemo(() => filterProducts(searchedProducts, { category }), [searchedProducts, category]);
  const results = useMemo(() => sortProducts(filteredProducts, sortBy), [filteredProducts, sortBy]);
  const suggestions = useMemo(() => getSearchSuggestions(products, query, 6), [products, query]);
  const emptyRecommendations = useMemo(() => sortProducts(products, "popular").slice(0, 4), [products]);

  return (
    <div className="container" style={{ padding: "var(--space-2xl) 0" }}>
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="section-title" style={{ marginBottom: "var(--space-md)", fontSize: "2.5rem" }}>Search Results</h1>
        <form action="/search" method="GET" style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)", maxWidth: 720 }}>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input"
            placeholder="Search products, categories, styles..."
            aria-label="Search products"
          />
          <button type="submit" className="btn">Search</button>
        </form>
        {suggestions.length > 0 && (
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
            {suggestions.map((suggestion) => (
              <button key={suggestion} className="btn btn-secondary" type="button" onClick={() => setQuery(suggestion)}>{suggestion}</button>
            ))}
          </div>
        )}
        {debouncedQuery ? (
          <p style={{ color: "var(--text-secondary)" }}>Showing {results.length} results for "{debouncedQuery}"</p>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>Showing all products</p>
        )}
      </div>

      <div className="filter-bar" style={{ marginBottom: "var(--space-lg)" }}>
        <select className="sort-select" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {facets.categories.map((facet) => <option key={facet.value} value={facet.value}>{facet.value} ({facet.count})</option>)}
        </select>
        <select className="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as CatalogSortOption)}>
          <option value="popular">Most relevant/popular</option>
          <option value="rating">Top rated</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading"><div className="spinner" />Searching...</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-2xl) 0" }}>
          <h2 className="section-title" style={{ marginBottom: "var(--space-md)" }}>No products found</h2>
          <p style={{ marginBottom: "var(--space-xl)" }}>We couldn't find anything matching your search. Try a suggestion or browse our popular picks.</p>
          <Link href="/products" className="btn btn-primary">
            Browse All Products
          </Link>
          <div className="grid" style={{ marginTop: "var(--space-xl)", textAlign: "left" }}>
            {emptyRecommendations.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      ) : (
        <div className="grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
