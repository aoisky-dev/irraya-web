"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { register } from "@/lib/api/auth";
import { login as apiLogin } from "@/lib/api/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      await register({ email, firstName, lastName, passwordHash: password });
      const data = await apiLogin(email, password);
      login(data.token, data.user);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "var(--space-4xl) auto" }}>
      <h1 className="section-title" style={{ textAlign: "center" }}>Create Account</h1>
      <p className="text-muted" style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        Join Irraya to track orders and save your wishlist.
      </p>

      {error && (
        <div style={{ padding: "12px", background: "#fde8e8", color: "var(--error)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <div style={{ flex: 1 }}>
            <label className="label">First Name</label>
            <input
              type="text"
              className="input"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Last Name</label>
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
          {isLoading ? "Creating..." : "Create Account"}
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
