"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { registerWithAuth } from "@/lib/api/auth";
import { assertValidPassword, PASSWORD_REQUIREMENTS_MESSAGE, sanitizeDisplayName, sanitizeEmail, sanitizePhoneInput } from "@/lib/auth/validation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);

    try {
      const normalizedEmail = sanitizeEmail(email);
      const normalizedPhone = sanitizePhoneInput(phone);
      const sanitizedFirstName = sanitizeDisplayName(firstName);
      const sanitizedLastName = sanitizeDisplayName(lastName);

      if (!normalizedEmail) {
        throw new Error("Enter your email address to create an account. Phone verification will be enabled later.");
      }

      if (!sanitizedFirstName || !sanitizedLastName) {
        throw new Error("First name and last name are required.");
      }

      assertValidPassword(password);

      const auth = await registerWithAuth({
        email: normalizedEmail,
        phone: normalizedPhone,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        passwordHash: password
      });

      login(auth.token, auth.user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to continue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "var(--space-4xl) auto" }}>
      <h1 className="section-title" style={{ textAlign: "center" }}>Create Account</h1>
      <p className="text-muted" style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        Join Irraya to track orders and save your wishlist. Verification will be enabled once email and SMS providers are configured.
      </p>

      {error && (
        <div style={{ padding: "12px", background: "var(--error-bg)", color: "var(--error)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <div style={{ flex: 1 }}>
            <label className="label">First Name *</label>
            <input
              type="text"
              className="input"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Last Name *</label>
            <input
              type="text"
              className="input"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
          />
        </div>
        <div>
          <label className="label">Password *</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              aria-describedby="password-help"
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
          <p id="password-help" className="text-muted" style={{ marginTop: "6px", fontSize: "0.85rem" }}>
            {PASSWORD_REQUIREMENTS_MESSAGE}
          </p>
        </div>

        <button className="btn btn-full" type="submit" disabled={isLoading}>
          {isLoading ? "Continuing..." : "Create Account"}
        </button>
      </form>


      <p style={{ textAlign: "center", marginTop: "var(--space-xl)", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
