import type { Review } from "../types";
import { medusaRequest } from "./client";

type ReviewApiRow = {
  id?: unknown;
  product_id?: unknown;
  author_name?: unknown;
  rating?: unknown;
  text?: unknown;
  image_urls?: unknown;
  status?: unknown;
  verified_purchase?: unknown;
  created_at?: unknown;
};

export type ReviewSummary = {
  productId: string;
  averageRating: number;
  reviewsCount: number;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapReview = (row: ReviewApiRow): Review => ({
  id: String(row.id ?? ""),
  productId: String(row.product_id ?? ""),
  authorName: String(row.author_name ?? "Irraya customer"),
  rating: Math.min(Math.max(Math.round(toNumber(row.rating, 5)), 1), 5),
  text: String(row.text ?? ""),
  imageUrls: Array.isArray(row.image_urls) ? row.image_urls.map(String) : undefined,
  status: String(row.status ?? "approved") as Review["status"],
  verifiedPurchase: row.verified_purchase === true,
  createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString()
});

export async function getProductReviews(productId: string): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
  const response = await medusaRequest<{ reviews?: ReviewApiRow[]; summary?: Partial<ReviewSummary> }>(
    `/store/products/${productId}/reviews`
  );
  return {
    reviews: (response.reviews ?? []).map(mapReview),
    summary: {
      productId,
      averageRating: toNumber(response.summary?.averageRating, 0),
      reviewsCount: toNumber(response.summary?.reviewsCount, 0)
    }
  };
}

export async function submitProductReview(input: {
  token: string;
  productId: string;
  rating: number;
  text: string;
  authorName: string;
  imageUrls?: string[];
}): Promise<{ review: Review; message: string }> {
  const response = await medusaRequest<{ review?: ReviewApiRow; message?: string }>(`/store/products/${input.productId}/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      rating: input.rating,
      text: input.text,
      author_name: input.authorName,
      image_urls: input.imageUrls ?? []
    })
  });

  if (!response.review) {
    throw new Error("Review submission did not return a review.");
  }

  return {
    review: mapReview(response.review),
    message: response.message || "Review submitted and pending moderation."
  };
}

