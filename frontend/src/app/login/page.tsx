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
        <button type="submit" className="btn btn-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", margin: "var(--space-xl) 0" }}>
        <hr style={{ flex: 1, borderColor: "var(--border-light)" }} />
        <span style={{ padding: "0 var(--space-md)", color: "var(--text-muted)", fontSize: "0.85rem" }}>OR</span>
        <hr style={{ flex: 1, borderColor: "var(--border-light)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <button className="btn btn-outline btn-full" type="button" onClick={() => alert("Google Login is a mock UI for this phase.")}>
          Continue with Google
        </button>
        <button className="btn btn-outline btn-full" type="button" onClick={() => alert("OTP Login is a mock UI for this phase.")}>
          Login with Mobile OTP
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
