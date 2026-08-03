"use client";
import { useState } from "react";
import { useToast } from "./ToastProvider";

export function NewsletterForm() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    addToast("Thanks for subscribing!", "success");
    setEmail("");
  };

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        className="form-input"
        placeholder="Enter your email"
        aria-label="Email for newsletter"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn">Subscribe</button>
    </form>
  );
}
