"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { verifyOtp, sendEmailVerificationOtp, getMe } from "@/lib/api/auth";
import type { User } from "@/lib/types";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get("email") || "";
  const initialRequestId = searchParams.get("requestId") || "";

  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState(initialRequestId);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp.trim(), requestId || undefined);

      // Retrieve pending auth token stored during registration
      let token: string | null = null;
      let user: User | null = null;
      try {
        token = sessionStorage.getItem("pending_auth_token");
        const raw = sessionStorage.getItem("pending_auth_user");
        if (raw) user = JSON.parse(raw) as User;
      } catch {}

      if (token) {
        if (!user) {
          try { user = await getMe(token) } catch {}
        }
        sessionStorage.removeItem("pending_auth_token");
        sessionStorage.removeItem("pending_auth_user");
        if (user) {
          login(token, user);
          router.push("/");
          return;
        }
      }

      // Fallback if token wasn't stored — show success and redirect to login
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await sendEmailVerificationOtp(email);
      setRequestId(res.requestId);
      setOtp("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  if (done) {
    return (
      <section className="auth-shell">
        <div className="auth-panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>✓</div>
          <h1 className="section-title">Email verified!</h1>
          <p className="auth-subtitle" style={{ marginBottom: "var(--space-xl)" }}>
            Your account has been verified. Please log in to continue.
          </p>
          <a href="/login" className="btn">Go to login</a>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-head">
          <span className="hero-tag">Verify Email</span>
          <h1 className="section-title">Check your inbox</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.
          </p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              autoFocus
              style={{ letterSpacing: "0.3em", fontSize: "1.4rem", textAlign: "center" }}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-full" disabled={loading || otp.length < 6}>
            {loading ? "Verifying…" : "Verify email"}
          </button>
          <p className="auth-footer-link">
            Didn't get it?{" "}
            <button type="button" className="link-button" onClick={handleResend} disabled={resending}>
              {resending ? "Sending…" : "Resend code"}
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
