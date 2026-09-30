"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword, verifyOtp, resetPassword } from "@/lib/api/auth";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setRequestId(res.requestId);
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp.trim(), requestId);
      setVerificationToken(res.verificationToken);
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(verificationToken, newPassword);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-lg)" }}>
          {(["email", "otp", "password"] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step === "done" || ["email","otp","password"].indexOf(step) >= i
                ? "var(--text-primary)"
                : "var(--border)",
              opacity: step === "done" || ["email","otp","password"].indexOf(step) > i ? 1 : step === s ? 1 : 0.3,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* Step: email */}
        {step === "email" && (
          <>
            <div className="auth-head">
              <span className="hero-tag">Reset Password</span>
              <h1 className="section-title">Forgot your password?</h1>
              <p className="auth-subtitle">Enter your email and we'll send you a verification code.</p>
            </div>
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset code"}
              </button>
              <p className="auth-footer-link">
                <Link href="/login">← Back to login</Link>
              </p>
            </form>
          </>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <>
            <div className="auth-head">
              <span className="hero-tag">Verify</span>
              <h1 className="section-title">Enter the code</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="auth-form">
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
                {loading ? "Verifying…" : "Verify code"}
              </button>
              <p className="auth-footer-link">
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => { setError(""); handleSendOtp({ preventDefault: () => {} } as any); }}
                >
                  Resend
                </button>
              </p>
            </form>
          </>
        )}

        {/* Step: new password */}
        {step === "password" && (
          <>
            <div className="auth-head">
              <span className="hero-tag">New Password</span>
              <h1 className="section-title">Set a new password</h1>
              <p className="auth-subtitle">Choose a strong password with at least 8 characters and one special character.</p>
            </div>
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Min. 8 chars + special character"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem" }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-full" disabled={loading || !newPassword || !confirmPassword}>
                {loading ? "Saving…" : "Reset password"}
              </button>
            </form>
          </>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "var(--space-xl) 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>✓</div>
            <h1 className="section-title">Password reset</h1>
            <p className="auth-subtitle" style={{ marginBottom: "var(--space-xl)" }}>
              Your password has been updated. You can now log in with your new password.
            </p>
            <Link href="/login" className="btn">Go to login</Link>
          </div>
        )}
      </div>
    </section>
  );
}
