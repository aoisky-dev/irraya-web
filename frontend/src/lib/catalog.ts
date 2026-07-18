import type { Product } from "./types";

export type CatalogSortOption = "newest" | "price-asc" | "price-desc" | "popular" | "rating";

export type CatalogFilters = {
  category?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
};

export type CatalogFacets = {
  categories: Array<{ value: string; count: number }>;
  colors: Array<{ value: string; count: number }>;
  sizes: Array<{ value: string; count: number }>;
  priceRange: { min: number; max: number };
};

const RECENTLY_VIEWED_KEY = "irraya_recently_viewed";

export function getPrimaryPrice(product: Product): number {
  const prices = product.variants.map((variant) => variant.priceInCents).filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + Math.max(variant.stock, 0), 0);
}

export function getStockLabel(product: Product): { label: string; tone: "success" | "warning" | "error" } {
  const stock = getTotalStock(product);
  if (stock <= 0) return { label: "Out of stock", tone: "error" };
  if (stock <= 5) return { label: `Low stock · ${stock} left`, tone: "warning" };
  return { label: "In stock", tone: "success" };
}

function increment(map: Map<string, number>, value: string): void {
  const normalized = value.trim();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + 1);
}

function mapToFacet(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
}

export function buildCatalogFacets(products: Product[]): CatalogFacets {
  const categories = new Map<string, number>();
  const colors = new Map<string, number>();
  const sizes = new Map<string, number>();
  const prices: number[] = [];

  for (const product of products) {
    increment(categories, product.category);
    for (const variant of product.variants) {
      increment(colors, variant.color);
      increment(sizes, variant.size);
      if (variant.priceInCents > 0) prices.push(variant.priceInCents);
    }
  }

  return {
    categories: mapToFacet(categories),
    colors: mapToFacet(colors),
    sizes: mapToFacet(sizes),
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    }
  };
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  return products.filter((product) => {
    const categoryMatch = !filters.category || filters.category === "all" || product.category.toLowerCase() === filters.category.toLowerCase();
    const colorMatch = !filters.color || product.variants.some((variant) => variant.color.toLowerCase() === filters.color?.toLowerCase());
    const sizeMatch = !filters.size || product.variants.some((variant) => variant.size.toLowerCase() === filters.size?.toLowerCase());
    const minPriceInCents = typeof filters.minPrice === "number" ? filters.minPrice * 100 : null;
    const maxPriceInCents = typeof filters.maxPrice === "number" ? filters.maxPrice * 100 : null;
    const priceMatch = product.variants.some((variant) => {
      if (minPriceInCents !== null && variant.priceInCents < minPriceInCents) return false;
      if (maxPriceInCents !== null && variant.priceInCents > maxPriceInCents) return false;
      return true;
    });
    const stockMatch = !filters.inStockOnly || getTotalStock(product) > 0;

    return categoryMatch && colorMatch && sizeMatch && priceMatch && stockMatch;
  });
}

export function sortProducts(products: Product[], sortBy: CatalogSortOption): Product[] {
  const result = [...products];
  switch (sortBy) {
    case "price-asc":
      return result.sort((a, b) => getPrimaryPrice(a) - getPrimaryPrice(b));
    case "price-desc":
      return result.sort((a, b) => getPrimaryPrice(b) - getPrimaryPrice(a));
    case "popular":
      return result.sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0));
    case "rating":
      return result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "newest":
    default:
      return result;
  }
}

export function tokenizeSearchQuery(query: string): string[] {
  return query.toLowerCase().split(/[^a-z0-9]+/i).map((part) => part.trim()).filter(Boolean);
}

export function scoreProductSearch(product: Product, query: string): number {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return 1;

  const title = product.title.toLowerCase();
  const category = product.category.toLowerCase();
  const description = product.description.toLowerCase();
  const metadata = Object.values(product.metadata ?? {}).join(" ").toLowerCase();
  const variants = product.variants.map((variant) => `${variant.color} ${variant.size} ${variant.sku}`).join(" ").toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title === token) score += 20;
    if (title.includes(token)) score += 10;
    if (category.includes(token)) score += 6;
    if (variants.includes(token)) score += 4;
    if (description.includes(token)) score += 3;
    if (metadata.includes(token)) score += 2;
  }

  return score;
}

export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  return products
    .map((product) => ({ product, score: scoreProductSearch(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.product.rating ?? 0) - (a.product.rating ?? 0))
    .map((entry) => entry.product);
}

export function getSearchSuggestions(products: Product[], query: string, limit = 6): string[] {
  const tokens = tokenizeSearchQuery(query);
  const suggestions = new Set<string>();
  for (const product of products) {
    if (!query || scoreProductSearch(product, query) > 0) {
      suggestions.add(product.title);
      suggestions.add(product.category);
      for (const variant of product.variants) {
        suggestions.add(variant.color);
        suggestions.add(variant.size);
      }
    }
  }
  const normalizedQuery = tokens.join(" ");
  return [...suggestions]
    .filter((suggestion) => suggestion && suggestion.toLowerCase() !== normalizedQuery)
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, products: Product[], limit = 4): Product[] {
  return products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === product.category) score += 8;
      if (candidate.metadata?.material && candidate.metadata.material === product.metadata?.material) score += 3;
      score += Math.min(candidate.rating ?? 0, 5);
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function trackRecentlyViewedProduct(product: Product): void {
  if (typeof window === "undefined") return;
  const existing = getRecentlyViewedProducts().filter((item) => item.id !== product.id);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([product, ...existing].slice(0, 8)));
}

export function getRecentlyViewedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

