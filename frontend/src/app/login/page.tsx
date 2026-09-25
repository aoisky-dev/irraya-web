"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { login as apiLogin } from "@/lib/api/auth";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [hideReason, setHideReason] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await apiLogin(identifier, password);
      login(data.token, data.user);
      const nextPath = searchParams.get("next") || "/account";
      router.push(nextPath.startsWith("/") ? nextPath : "/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-head">
          <span className="hero-tag">Account Access</span>
          <h1 className="section-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your orders, wishlist, and profile details.</p>
        </div>

        {!hideReason && searchParams.get("reason") === "checkout" && (
          <div className="auth-info" style={{ marginBottom: "var(--space-md)" }}>
            <span>Please log in to place an order</span>
            <button type="button" className="auth-dismiss" onClick={() => setHideReason(true)} aria-label="Close">
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="auth-error">
            <span>{error}</span>
            <button type="button" className="auth-dismiss" onClick={() => setError("")} aria-label="Close">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="label" htmlFor="login-identifier">Email / Phone Number</label>
            <input
              id="login-identifier"
              type="text"
              className="input"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or phone number"
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex", alignItems: "center" }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <button className="btn btn-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>


        <div className="auth-footer-note">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </div>
      </div>
    </section>
  );
}
