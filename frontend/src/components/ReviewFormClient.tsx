"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { submitProductReview, checkCanReview } from "@/lib/api/reviews";
import { IconCheck } from "@/components/Icons";
import type { Product } from "@/lib/types";

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

export function ReviewFormClient({ product }: { product: Product }) {
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    text: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      checkCanReview(token, product.id).then(setCanReview).catch(() => setCanReview(false));
    } else if (token === null) {
      setCanReview(false);
    }
  }, [token, product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please sign in to write a review.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const computedAuthorName = user ? `${user.firstName} ${user.lastName}`.trim() : "Customer";

      const { message } = await submitProductReview({
        token,
        productId: product.id,
        authorName: computedAuthorName,
        rating: newReview.rating,
        text: newReview.text.trim(),
      });

      setMessage(message);
      setNewReview({ rating: 5, text: "" });
      
      // Redirect back to product page after a short delay
      setTimeout(() => {
        router.push(`/products/${product.handle}`);
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (canReview === null) {
    return <div style={{ padding: "var(--space-2xl) 0", textAlign: "center" }}>Loading...</div>;
  }

  if (canReview === false) {
    return (
      <div style={{ padding: "var(--space-2xl) 0", textAlign: "center" }}>
        <h2 style={{ marginBottom: "var(--space-md)" }}>Unable to leave a review</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-xl)" }}>
          {!token 
            ? "You need to be signed in to leave a review." 
            : "Only customers who have received this product can leave a review."}
        </p>
        <button onClick={() => router.push(`/products/${product.handle}`)} className="btn btn-primary">
          Back to Product
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-2xl) 0" }}>
      <h1 className="page-title" style={{ marginBottom: "var(--space-xl)" }}>Write a Review</h1>
      
      <div style={{ display: "flex", gap: "var(--space-lg)", alignItems: "center", marginBottom: "var(--space-xl)", padding: "var(--space-md)", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
        {product.images?.[0] && (
          <Image src={product.images[0]} alt={product.title} width={60} height={80} style={{ objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
        )}
        <div>
          <h3 style={{ margin: "0 0 4px" }}>{product.title}</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>{product.category}</p>
        </div>
      </div>

      {message ? (
        <div style={{ padding: "var(--space-xl)", background: "var(--success-light, #ecfdf5)", color: "var(--success, #065f46)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <IconCheck size={32} style={{ margin: "0 auto var(--space-md)", display: "block" }} />
          <h3 style={{ margin: "0 0 var(--space-sm)" }}>Review Submitted!</h3>
          <p style={{ margin: 0 }}>{message}</p>
          <p style={{ margin: "var(--space-md) 0 0", fontSize: "0.9rem" }}>Redirecting you back...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-primary)", padding: "var(--space-xl)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          {error && <p style={{ color: "var(--error)", marginBottom: "var(--space-md)", padding: "12px", background: "#fef2f2", borderRadius: "4px" }}>{error}</p>}

          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "var(--space-sm)" }}>Your Rating</label>
            <StarRating
              rating={newReview.rating}
              onSelect={(star) => setNewReview({ ...newReview, rating: star })}
              interactive
              size={32}
            />
          </div>

          <div className="form-grid" style={{ gap: "var(--space-md)" }}>
            <div className="form-group full">
              <label className="form-label">Your Review (Optional)</label>
              <textarea className="form-input" rows={6} value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                placeholder="What did you like about this product? How was the fit and quality?"
                style={{ resize: "vertical" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-xl)" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Review"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => router.push(`/products/${product.handle}`)} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
