"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/api/products";
import { searchProducts, getSearchSuggestions, getPrimaryPrice } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { IconSearch, IconX, IconTrendingUp } from "@/components/Icons";

const TRENDING_SEARCHES = ["Dresses", "Co-ords", "Tops", "Outerwear", "Sale"];

interface SearchTypeaheadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchTypeaheadModal({ isOpen, onClose }: SearchTypeaheadModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load products cache once on mount
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getProducts({ limit: 100 })
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setIsLoading(false));

      // Read search history
      try {
        const history = JSON.parse(localStorage.getItem("irraya_search_history") ?? "[]") as string[];
        setRecentSearches(history.slice(0, 5));
      } catch {}

      // Lock body scroll
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(products, query.trim()).slice(0, 5);
  }, [products, query]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return getSearchSuggestions(products, query.trim(), 4);
  }, [products, query]);

  const handleSearchSubmit = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    // Save to local storage history
    try {
      const history = JSON.parse(localStorage.getItem("irraya_search_history") ?? "[]") as string[];
      const updated = [q, ...history.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 10);
      localStorage.setItem("irraya_search_history", JSON.stringify(updated));
    } catch {}

    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem("irraya_search_history");
      setRecentSearches([]);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="search-modal-header">
          <IconSearch size={20} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search dresses, co-ords, tops..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit(query);
              }
            }}
            aria-label="Search products"
          />
          {query ? (
            <button
              type="button"
              className="search-modal-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear query"
            >
              <IconX size={18} />
            </button>
          ) : null}
          <button type="button" className="search-modal-close" onClick={onClose} aria-label="Close search">
            <span className="search-modal-esc">ESC</span>
            <IconX size={18} className="search-modal-x-icon" />
          </button>
        </div>

        {/* Results / Suggestions Body */}
        <div className="search-modal-body">
          {query.trim().length === 0 ? (
            <div className="search-modal-previews">
              {recentSearches.length > 0 && (
                <div className="search-pill-group">
                  <div className="search-group-header">
                    <span className="search-group-title">Recent Searches</span>
                    <button type="button" onClick={clearHistory} className="search-clear-link">
                      Clear
                    </button>
                  </div>
                  <div className="search-pills">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="search-pill"
                        onClick={() => {
                          setQuery(term);
                          handleSearchSubmit(term);
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-pill-group">
                <div className="search-group-header">
                  <span className="search-group-title">
                    <IconTrendingUp size={14} style={{ marginRight: 6 }} /> Trending Searches
                  </span>
                </div>
                <div className="search-pills">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="search-pill search-pill--trending"
                      onClick={() => {
                        setQuery(term);
                        handleSearchSubmit(term);
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="search-modal-results">
              {suggestions.length > 0 && (
                <div className="search-suggestions-row">
                  <span className="search-suggestion-label">Suggestions:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      className="search-suggestion-btn"
                      onClick={() => {
                        setQuery(sug);
                        handleSearchSubmit(sug);
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length > 0 ? (
                <div className="search-results-list">
                  <div className="search-results-count">
                    Top products for <strong>&ldquo;{query}&rdquo;</strong>
                  </div>
                  {searchResults.map((product) => {
                    const price = getPrimaryPrice(product);
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.handle}`}
                        className="search-result-item"
                        onClick={onClose}
                      >
                        <div className="search-result-image">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              sizes="60px"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div className="search-result-placeholder" />
                          )}
                        </div>
                        <div className="search-result-info">
                          <span className="search-result-category">{product.category || "Collection"}</span>
                          <span className="search-result-title">{product.title}</span>
                          <span className="search-result-price">
                            {formatMoney(price, "inr")}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    className="search-view-all-btn"
                    onClick={() => handleSearchSubmit(query)}
                  >
                    View all results for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              ) : (
                <div className="search-empty-state">
                  <p className="search-empty-text">
                    No results found for <strong>&ldquo;{query}&rdquo;</strong>
                  </p>
                  <p className="search-empty-sub">
                    Check your spelling or try searching for another term.
                  </p>
                  <Link
                    href="/products"
                    className="btn btn-outline"
                    onClick={onClose}
                    style={{ marginTop: 12, display: "inline-block" }}
                  >
                    Browse All Products
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
