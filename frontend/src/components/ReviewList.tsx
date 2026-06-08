"use client";

import React, { useState } from "react";
import type { Review } from "@/lib/types";

interface ReviewListProps {
  productId: string;
  initialReviews: Review[];
}

export function ReviewList({ productId, initialReviews }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: "", authorName: "" });

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "2px", color: "var(--accent)" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "★" : "☆"}</span>
        ))}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.text.trim() || !newReview.authorName.trim()) return;

    const review: Review = {
      id: `rev_${Date.now()}`,
      productId,
      authorName: newReview.authorName,
      rating: newReview.rating,
      text: newReview.text,
      createdAt: new Date().toISOString(),
    };

    setReviews([review, ...reviews]);
    setIsFormOpen(false);
    setNewReview({ rating: 5, text: "", authorName: "" });
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

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-primary)", padding: "var(--space-xl)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-xl)", border: "1px solid var(--border)" }}>
          <h4 style={{ marginBottom: "var(--space-md)" }}>Write a Review</h4>
          
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

          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <button type="submit" className="btn btn-primary">Submit Review</button>
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
                <strong>{review.authorName}</strong>
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {renderStars(review.rating)}
              <p style={{ marginTop: "var(--space-sm)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
