"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { changePassword } from "@/lib/api/auth";
import { PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/auth/validation";

export default function ChangePasswordPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading && !user) {
      router.push("/login?next=%2Faccount%2Fchange-password");
    }
  }, [isClient, isLoading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token || !user) {
      setError("You must be signed in to change your password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword({
        token,
        email: user.email,
        currentPassword,
        newPassword
      });
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || isLoading || !user) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading password settings...
      </div>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-head">
          <span className="hero-tag">Security</span>
          <h1 className="section-title">Change Password</h1>
          <p className="auth-subtitle">Enter your current password, then choose a new password.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && (
          <div style={{ padding: "12px", background: "var(--success-bg)", color: "var(--success)", borderRadius: "var(--radius-md)" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="label" htmlFor="current-password">Current Password *</label>
            <input
              id="current-password"
              type="password"
              className="input"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="label" htmlFor="new-password">New Password *</label>
            <input
              id="new-password"
              type="password"
              className="input"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              aria-describedby="password-help"
            />
            <p id="password-help" className="text-muted" style={{ marginTop: "6px", fontSize: "0.85rem" }}>
              {PASSWORD_REQUIREMENTS_MESSAGE}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="confirm-password">Confirm New Password *</label>
            <input
              id="confirm-password"
              type="password"
              className="input"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="btn btn-full" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </form>

        <div className="auth-footer-note">
          <Link href="/account">Back to account</Link>
        </div>
      </div>
    </section>
  );
}

