"use client";

import React, { useEffect, useState } from "react";
import type { Review } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { getProductReviews, submitProductReview, type ReviewSummary } from "@/lib/api/reviews";
import { IconCheck } from "@/components/Icons";

interface ReviewListProps {
  productId: string;
  initialReviews: Review[];
}

function StarRating({ rating, onSelect, interactive = false, size = 18 }: {
  rating: number;
  onSelect?: (star: number) => void;
  interactive?: boolean;
  size?: number;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  return (
    <div
      style={{ display: "inline-flex", gap: "2px", cursor: interactive ? "pointer" : "default" }}
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ fontSize: `${size}px`, color: star <= displayRating ? "var(--accent-warm, #d97706)" : "var(--border, #ddd)", transition: "color 0.15s" }}
          onClick={() => interactive && onSelect?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          role={interactive ? "button" : undefined}
          aria-label={interactive ? `Rate ${star} star${star > 1 ? "s" : ""}` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem" }}>
      <span style={{ width: "20px", textAlign: "right", color: "var(--text-muted)" }}>{star}</span>
      <StarRating rating={star} size={12} />
      <div style={{ flex: 1, height: "6px", background: "var(--border-light, var(--border))", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent-warm, #d97706)", borderRadius: "3px", transition: "width 0.3s" }} />
      </div>
      <span style={{ width: "28px", textAlign: "right", color: "var(--text-muted)", fontSize: "0.72rem" }}>{count}</span>
    </div>
  );
}

export function ReviewList({ productId, initialReviews }: ReviewListProps) {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    text: "",
    authorName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    getProductReviews(productId)
      .then(({ reviews: apiReviews, summary: apiSummary }) => {
        setReviews(apiReviews.length ? apiReviews : initialReviews);
        setSummary(apiSummary);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load reviews."))
      .finally(() => setIsLoading(false));
  }, [initialReviews, productId]);

  // Compute rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating - 1]++;
  });
  const avgRating = summary?.averageRating ||
    (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please sign in to write a review.");
      return;
    }
    if (!newReview.text.trim()) {
      setError("Please write your review.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const { review, message } = await submitProductReview({
        token,
        productId,
        authorName: (newReview.authorName.trim() || user?.firstName || "Customer"),
        rating: newReview.rating,
        text: newReview.text.trim(),
      });

      setReviews((prev) => [review, ...prev]);
      setMessage(message);
      setIsFormOpen(false);
      setNewReview({ rating: 5, text: "", authorName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: "var(--space-2xl)", alignItems: "flex-start", marginBottom: "var(--space-2xl)", flexWrap: "wrap" }}>
        {/* Left: average rating */}
        <div style={{ textAlign: "center", minWidth: "100px" }}>
          <p style={{ fontSize: "2.8rem", fontWeight: 700, lineHeight: 1, color: "var(--text-primary)" }}>
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </p>
          <StarRating rating={Math.round(avgRating)} size={16} />
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right: rating distribution */}
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar key={star} star={star} count={ratingCounts[star - 1]} total={reviews.length} />
          ))}
        </div>

        {/* Write review button */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {!isFormOpen && (
            <button className="btn btn-outline" onClick={() => setIsFormOpen(true)}>
              Write a Review
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>Loading reviews...</p>}
      {message && <p style={{ color: "var(--success, green)", marginBottom: "var(--space-md)" }}>{message}</p>}
      {error && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>{error}</p>}

      {/* Review form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-primary)", padding: "var(--space-xl)", borderRadius: "var(--radius-md, 0)", marginBottom: "var(--space-xl)", border: "1px solid var(--border)" }}>
          <h4 style={{ marginBottom: "var(--space-lg)", fontFamily: "var(--font-display)", fontWeight: 700 }}>Write a Review</h4>
          {!token && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)", fontSize: "0.85rem" }}>Please sign in before submitting a review.</p>}

          {/* Star rating — clickable */}
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "var(--space-sm)" }}>Your Rating</label>
            <StarRating
              rating={newReview.rating}
              onSelect={(star) => setNewReview({ ...newReview, rating: star })}
              interactive
              size={28}
            />
          </div>

          <div className="form-grid" style={{ gap: "12px" }}>
            <div className="form-group full">
              <label className="form-label">Your Name</label>
              <input className="form-input" type="text" required value={newReview.authorName}
                onChange={(e) => setNewReview({ ...newReview, authorName: e.target.value })} />
            </div>

            <div className="form-group full">
              <label className="form-label">Your Review</label>
              <textarea className="form-input" required rows={4} value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                placeholder="Share your experience with this product…"
                style={{ resize: "vertical" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
            <button type="submit" className="btn" disabled={isSubmitting || !token}>
              {isSubmitting ? "Submitting…" : "Submit Review"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ padding: "var(--space-lg)", background: "var(--bg-primary)", border: "1px solid var(--border-light, var(--border))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.78rem", color: "var(--text-muted)", flexShrink: 0
                  }}>
                    {review.authorName[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.88rem" }}>
                      {review.authorName}
                      {review.verifiedPurchase && (
                        <span style={{ marginLeft: "6px", fontSize: "0.7rem", color: "var(--success, #059669)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}><IconCheck size={12} /> Verified</span>
                      )}
                    </strong>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              {review.status === "pending" && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--space-sm)", fontStyle: "italic" }}>Pending moderation</p>
              )}
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                {review.text}
              </p>
              {review.imageUrls && review.imageUrls.length > 0 && (
                <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
                  {review.imageUrls.map((url) => (
                    <img key={url} src={url} alt="Review" style={{ width: "72px", height: "72px", objectFit: "cover", border: "1px solid var(--border)" }} />
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
