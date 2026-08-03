"use client";

import React, { useEffect, useState } from "react";
import type { Review } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { getProductReviews, submitProductReview } from "@/lib/api/reviews";

interface ReviewListProps {
  productId: string;
  initialReviews: Review[];
}

export function ReviewList({ productId, initialReviews }: ReviewListProps) {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    text: "",
    authorName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "",
    imageUrls: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    getProductReviews(productId)
      .then(({ reviews: apiReviews }) => setReviews(apiReviews.length ? apiReviews : initialReviews))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load reviews."))
      .finally(() => setIsLoading(false));
  }, [initialReviews, productId]);

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "2px", color: "var(--accent)" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "★" : "☆"}</span>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please sign in to write a review.");
      return;
    }
    if (!newReview.text.trim() || !newReview.authorName.trim()) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const { review, message } = await submitProductReview({
        token,
        productId,
        authorName: newReview.authorName.trim(),
        rating: newReview.rating,
        text: newReview.text.trim(),
        imageUrls: newReview.imageUrls.split("\n").map((url) => url.trim()).filter(Boolean)
      });

      setReviews((prev) => [review, ...prev]);
      setMessage(message);
      setIsFormOpen(false);
      setNewReview({ rating: 5, text: "", authorName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "", imageUrls: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <h3 className="text-xl font-bold">Reviews ({reviews.length})</h3>
        {!isFormOpen && (
          <button className="btn btn-outline" onClick={() => setIsFormOpen(true)}>
            Write a Review
          </button>
        )}
      </div>

      {isLoading && <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>Loading reviews...</p>}
      {message && <p style={{ color: "var(--success, green)", marginBottom: "var(--space-md)" }}>{message}</p>}
      {error && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>{error}</p>}

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-primary)", padding: "var(--space-xl)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-xl)", border: "1px solid var(--border)" }}>
          <h4 style={{ marginBottom: "var(--space-md)" }}>Write a Review</h4>
          {!token && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>Please sign in before submitting a review.</p>}

          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={{ display: "block", marginBottom: "var(--space-xs)" }}>Rating</label>
            <select className="input" value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}>
              <option value={5}>5 Stars - Excellent</option>
              <option value={4}>4 Stars - Good</option>
              <option value={3}>3 Stars - Average</option>
              <option value={2}>2 Stars - Poor</option>
              <option value={1}>1 Star - Terrible</option>
            </select>
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={{ display: "block", marginBottom: "var(--space-xs)" }}>Name</label>
            <input className="input" type="text" required value={newReview.authorName} onChange={(e) => setNewReview({ ...newReview, authorName: e.target.value })} style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={{ display: "block", marginBottom: "var(--space-xs)" }}>Review</label>
            <textarea className="input" required rows={4} value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} style={{ width: "100%", resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={{ display: "block", marginBottom: "var(--space-xs)" }}>Image URLs (optional, one per line)</label>
            <textarea className="input" rows={2} value={newReview.imageUrls} onChange={(e) => setNewReview({ ...newReview, imageUrls: e.target.value })} style={{ width: "100%", resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !token}>{isSubmitting ? "Submitting..." : "Submit Review"}</button>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "var(--space-lg)" }}>
          {reviews.map((review) => (
            <div key={review.id} className="review-card" style={{ padding: "var(--space-lg)", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-sm)" }}>
                <strong>{review.authorName} {review.verifiedPurchase && <span className="badge badge-success" style={{ marginLeft: "var(--space-xs)" }}>Verified purchase</span>}</strong>
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.status === "pending" && <p className="text-muted" style={{ fontSize: "0.85rem" }}>Pending moderation</p>}
              {renderStars(review.rating)}
              <p style={{ marginTop: "var(--space-sm)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {review.text}
              </p>
              {review.imageUrls && review.imageUrls.length > 0 && (
                <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
                  {review.imageUrls.map((url) => (
                    <img key={url} src={url} alt="Review image" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
