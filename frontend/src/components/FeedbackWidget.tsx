"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { submitFeedback } from "@/lib/api/feedback";
import { IconMessageCircle, IconX } from "@/components/Icons";

/**
 * Site-wide feedback widget: a floating button that opens a small form for
 * submitting general feedback (bug reports, suggestions, praise) from any
 * page. Posts to `/store/feedback` on the backend.
 */
export function FeedbackWidget() {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Hide on admin pages — they are being phased out in favor of Medusa Admin.
  if (pathname?.startsWith("/admin")) return null;

  const resetAndClose = () => {
    setIsOpen(false);
    setMessage("");
    setRating(0);
    setEmail("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please share a few words of feedback.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitFeedback({
        message: message.trim(),
        email: email.trim() || user?.email,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
        rating: rating > 0 ? rating : undefined,
        pageUrl: pathname ?? undefined,
        token: token ?? undefined
      });

      addToast("Thanks for your feedback!", "success");
      resetAndClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Share feedback"
        style={{
          position: "fixed",
          right: "var(--space-xl, 24px)",
          bottom: "var(--space-xl, 24px)",
          zIndex: 900,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--text-primary, #1a1a1a)",
          color: "var(--bg-primary, #fff)",
          border: "none",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)"
        }}
      >
        <IconMessageCircle size={22} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Share feedback"
          style={{
            position: "fixed",
            right: "var(--space-xl, 24px)",
            bottom: "var(--space-xl, 24px)",
            zIndex: 900,
            width: "min(340px, calc(100vw - 32px))",
            background: "var(--bg-primary, #fff)",
            border: "1px solid var(--border, #e5e5e5)",
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            padding: "var(--space-lg, 20px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md, 12px)" }}>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>Share your feedback</h4>
            <button
              onClick={resetAndClose}
              aria-label="Close feedback form"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <IconX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-md, 12px)" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.4rem",
                    color: star <= rating ? "var(--accent-warm, #d97706)" : "var(--border, #ddd)",
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="form-input"
              rows={3}
              placeholder="What's on your mind? Bugs, ideas, or praise — we read it all."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: "100%", resize: "vertical", marginBottom: "var(--space-sm, 8px)" }}
              required
            />

            {!user && (
              <input
                className="form-input"
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", marginBottom: "var(--space-sm, 8px)" }}
              />
            )}

            {error && <p style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "var(--space-sm, 8px)" }}>{error}</p>}

            <button type="submit" className="btn" disabled={isSubmitting} style={{ width: "100%" }}>
              {isSubmitting ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

