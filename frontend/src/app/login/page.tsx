"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { login as apiLogin } from "@/lib/api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // In this mock, password is just whatever the user enters as the hash
      const data = await apiLogin(email, password);
      login(data.token, data.user);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "var(--space-4xl) auto" }}>
      <h1 className="section-title" style={{ textAlign: "center" }}>Welcome Back</h1>
      <p className="text-muted" style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        Sign in to your Irraya account
      </p>

      {error && (
        <div style={{ padding: "12px", background: "#fde8e8", color: "var(--error)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-full" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
        <div style={{ marginTop: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-sm)", color: "var(--text-muted)" }}>
          <hr style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
          <span style={{ fontSize: "0.85rem" }}>or continue with</span>
          <hr style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
        </div>

        <div style={{ marginTop: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <button type="button" className="btn btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-sm)" }}>
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
            Continue with Google
          </button>
          <button type="button" className="btn btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-sm)" }}>
            <img src="https://authjs.dev/img/providers/apple.svg" alt="Apple" style={{ width: "20px", height: "20px" }} />
            Continue with Apple
          </button>
        </div>

      <p style={{ textAlign: "center", marginTop: "var(--space-xl)", fontSize: "0.9rem" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 500 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
