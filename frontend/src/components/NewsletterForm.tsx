"use client";
import { useState } from "react";
import { useToast } from "./ToastProvider";

export function NewsletterForm() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    addToast("Welcome to the Irraya Circle! Use code FIRST10 for 10% off.", "success");
    setEmail("");
  };

  if (subscribed) {
    return (
      <div
        className="newsletter-success"
        style={{
          padding: "var(--space-md) var(--space-lg)",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "var(--radius-sm)",
          color: "white",
          maxWidth: "460px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: "0.95rem" }}>
          ✦ Welcome to the Irraya Circle
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
          Use code <strong style={{ color: "#d4a373", letterSpacing: "0.08em" }}>FIRST10</strong> at checkout for 10% off your first order.
        </p>
      </div>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        required
        className="form-input"
        placeholder="Enter your email address"
        aria-label="Email for newsletter"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          flex: 1,
          background: "rgba(255, 255, 255, 0.08)",
          borderColor: "rgba(255, 255, 255, 0.2)",
          color: "#fff",
        }}
      />
      <button
        type="submit"
        className="btn"
        style={{
          background: "white",
          color: "#0E0E0E",
          border: "none",
          fontWeight: 600,
        }}
      >
        Join Circle
      </button>
    </form>
  );
}

