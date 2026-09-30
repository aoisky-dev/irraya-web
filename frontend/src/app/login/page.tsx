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
          <div style={{ textAlign: "right", marginTop: "var(--space-xs)" }}>
            <Link href="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Forgot password?
            </Link>
          </div>
        </form>

        <div style={{ margin: "var(--space-md) 0", display: "flex", alignItems: "center", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
          <span style={{ padding: "0 10px", fontSize: "0.9rem" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
        </div>

        <button 
          className="btn btn-outline btn-full" 
          onClick={async () => {
            const nextPath = searchParams.get("next") || "/";
            sessionStorage.setItem("post_login_redirect", nextPath);

            const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
            const backendUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "http://localhost:9000"}/auth/customer/google?redirectTo=${redirectUrl}`;
            try {
              const res = await fetch(backendUrl);
              const data = await res.json();
              if (data.location) {
                window.location.href = data.location;
              }
            } catch (error) {
              console.error("Failed to initiate Google Auth:", error);
            }
          }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", backgroundColor: "var(--bg-secondary)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>


        <div className="auth-footer-note">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </div>
      </div>
    </section>
  );
}
