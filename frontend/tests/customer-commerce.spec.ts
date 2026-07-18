import { afterEach, describe, expect, it, vi } from "vitest";
import { addWishlistProduct, getWishlist, removeWishlistProduct } from "../src/lib/api/wishlist";
import { getCompareList, syncCompareList } from "../src/lib/api/compare";
import { getProductReviews, submitProductReview } from "../src/lib/api/reviews";
import type { Product } from "../src/lib/types";

const product: Product = {
  id: "prod_123",
  handle: "linen-shirt",
  title: "Linen Shirt",
  description: "Lightweight linen shirt",
  category: "shirts",
  status: "published",
  image: "https://example.com/linen.jpg",
  variants: [
    { id: "var_1", sku: "LIN-S", size: "S", color: "White", priceInCents: 250000, stock: 8 }
  ],
  metadata: { material: "Linen" }
};

describe("customer commerce api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads, adds, and removes wishlist products through authenticated backend APIs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [{ product_id: product.id, product_snapshot: product }] }))
      .mockResolvedValueOnce(Response.json({ item: { product_id: product.id, product_snapshot: product } }))
      .mockResolvedValueOnce(Response.json({ removed: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getWishlist("token_123")).resolves.toEqual([product]);
    await expect(addWishlistProduct("token_123", product)).resolves.toEqual(product);
    await expect(removeWishlistProduct("token_123", product.id)).resolves.toBeUndefined();

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/customers/me/wishlist");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token_123" });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ product_id: product.id, product });
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({ product_id: product.id });
  });

  it("loads and syncs compare products through authenticated backend APIs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [{ product_id: product.id, product_snapshot: product }] }))
      .mockResolvedValueOnce(Response.json({ items: [{ product_id: product.id, product_snapshot: product }] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCompareList("token_123")).resolves.toEqual([product]);
    await expect(syncCompareList("token_123", [product])).resolves.toEqual([product]);

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/customers/me/compare");
    expect(String(fetchMock.mock.calls[1][0])).toBe("http://localhost:9000/store/customers/me/compare");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      items: [{ product_id: product.id, product }]
    });
  });

  it("loads reviews and submits authenticated review payloads", async () => {
    const reviewRow = {
      id: 42,
      product_id: product.id,
      author_name: "Test User",
      rating: 5,
      text: "Excellent quality",
      image_urls: ["https://example.com/review.jpg"],
      status: "approved",
      verified_purchase: true,
      created_at: "2026-07-18T00:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({
        reviews: [reviewRow],
        summary: { productId: product.id, averageRating: 5, reviewsCount: 1 }
      }))
      .mockResolvedValueOnce(Response.json({
        review: { ...reviewRow, status: "pending", verified_purchase: false },
        message: "Review submitted and pending moderation."
      }));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getProductReviews(product.id);
    expect(loaded.summary).toEqual({ productId: product.id, averageRating: 5, reviewsCount: 1 });
    expect(loaded.reviews[0]).toMatchObject({ id: "42", productId: product.id, verifiedPurchase: true });

    const submitted = await submitProductReview({
      token: "token_123",
      productId: product.id,
      rating: 5,
      text: "Excellent quality",
      authorName: "Test User",
      imageUrls: ["https://example.com/review.jpg"]
    });

    expect(submitted.review.status).toBe("pending");
    expect(String(fetchMock.mock.calls[1][0])).toBe(`http://localhost:9000/store/products/${product.id}/reviews`);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: "Bearer token_123" });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      rating: 5,
      text: "Excellent quality",
      author_name: "Test User",
      image_urls: ["https://example.com/review.jpg"]
    });
  });
});

