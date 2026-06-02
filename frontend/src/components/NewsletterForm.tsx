"use client";

export function NewsletterForm() {
  return (
    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        className="form-input"
        placeholder="Enter your email"
        aria-label="Email for newsletter"
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn">Subscribe</button>
    </form>
  );
}
