"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {
        router.push("/login?next=%2Fadmin%2Fsale");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Verifying administrative permissions…</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <h2>Access Restricted</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          You do not have administrative privileges to access this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
