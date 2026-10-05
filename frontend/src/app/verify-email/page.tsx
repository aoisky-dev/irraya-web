"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { verifyOtp, sendEmailVerificationOtp, getMe, registerWithAuth } from "@/lib/api/auth";
import type { User } from "@/lib/types";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { addToast } = useToast();

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

      let token: string | null = null;
      let user: User | null = null;
      
      try {
        const rawReg = sessionStorage.getItem("pending_registration");
        if (rawReg) {
          const regData = JSON.parse(rawReg);
          const auth = await registerWithAuth(regData);
          token = auth.token;
          user = auth.user;
          sessionStorage.removeItem("pending_registration");
        } else {
          // Fallback if they were already registered but just verifying (e.g., from old flow)
          token = sessionStorage.getItem("pending_auth_token");
          const rawUser = sessionStorage.getItem("pending_auth_user");
          if (rawUser) user = JSON.parse(rawUser) as User;
        }
      } catch (e) {
        console.error("Registration error after OTP:", e);
        throw new Error("Email verified, but account creation failed. Please try registering again.");
      }

      if (token) {
        if (!user) {
          try { user = await getMe(token) } catch {}
        }
        sessionStorage.removeItem("pending_auth_token");
        sessionStorage.removeItem("pending_auth_user");
        if (user) {
          login(token, user);
          addToast("Account created successfully! Welcome to Irraya.", "success");
          router.push("/");
          return;
        }
      }

      // Fallback if token wasn't generated — show success and redirect to login
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
          <div style={{ marginTop: "var(--space-xl)", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-sm)", alignItems: "center" }}>
            <p className="text-secondary" style={{ fontSize: "0.9rem" }}>Didn't receive the email?</p>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleResend} 
              disabled={resending}
              style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", height: "auto", borderRadius: "100px" }}
            >
              {resending ? "Sending..." : "Resend Verification Code"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function VerifyEmailPageContent() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
