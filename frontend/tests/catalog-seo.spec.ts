import { describe, expect, it, vi } from "vitest";
import {
  buildCatalogFacets,
  filterProducts,
  getRelatedProducts,
  getSearchSuggestions,
  getStockLabel,
  searchProducts,
  sortProducts,
  trackRecentlyViewedProduct,
  getRecentlyViewedProducts
} from "../src/lib/catalog";
import { productJsonLd, productMetadata } from "../src/lib/seo";
import type { Product } from "../src/lib/types";

const products: Product[] = [
  {
    id: "prod_1",
    handle: "linen-shirt",
    title: "Linen Shirt",
    description: "Breathable white linen shirt",
    category: "shirts",
    status: "published",
    image: "https://example.com/linen.jpg",
    rating: 4.7,
    reviewsCount: 12,
    variants: [
      { id: "var_1", sku: "LIN-S-W", size: "S", color: "White", priceInCents: 250000, stock: 4 },
      { id: "var_2", sku: "LIN-M-W", size: "M", color: "White", priceInCents: 260000, stock: 0 }
    ],
    metadata: { material: "Linen", metaTitle: "Premium Linen Shirt" }
  },
  {
    id: "prod_2",
    handle: "cotton-tee",
    title: "Cotton Tee",
    description: "Everyday black cotton t-shirt",
    category: "t-shirts",
    status: "published",
    rating: 4.2,
    reviewsCount: 5,
    variants: [
      { id: "var_3", sku: "TEE-M-B", size: "M", color: "Black", priceInCents: 120000, stock: 20 }
    ],
    metadata: { material: "Cotton" }
  }
];

describe("catalog utilities", () => {
  it("builds facets and filters products by category color size price and stock", () => {
    const facets = buildCatalogFacets(products);
    expect(facets.categories).toEqual([{ value: "shirts", count: 1 }, { value: "t-shirts", count: 1 }]);
    expect(facets.colors.map((facet) => facet.value)).toEqual(["Black", "White"]);

    const filtered = filterProducts(products, {
      category: "shirts",
      color: "White",
      size: "S",
      minPrice: 2000,
      maxPrice: 3000,
      inStockOnly: true
    });

    expect(filtered.map((product) => product.id)).toEqual(["prod_1"]);
    expect(getStockLabel(products[0]).tone).toBe("warning");
  });

  it("sorts searches suggests and recommends related products", () => {
    expect(sortProducts(products, "price-asc").map((product) => product.id)).toEqual(["prod_2", "prod_1"]);
    expect(searchProducts(products, "white linen").map((product) => product.id)).toEqual(["prod_1"]);
    expect(getSearchSuggestions(products, "linen")).toContain("Linen Shirt");
    expect(getRelatedProducts(products[0], products).map((product) => product.id)).toEqual(["prod_2"]);
  });

  it("tracks recently viewed products in localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      length: 0
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });

    trackRecentlyViewedProduct(products[0]);
    expect(getRecentlyViewedProducts()[0].id).toBe("prod_1");
  });
});

describe("seo utilities", () => {
  it("creates product metadata and JSON-LD", () => {
    const metadata = productMetadata(products[0]);
    expect(metadata.title).toBe("Premium Linen Shirt");
    expect(metadata.alternates?.canonical).toContain("/products/linen-shirt");

    const jsonLd = productJsonLd(products[0]) as any;
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });
});


