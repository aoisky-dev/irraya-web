"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlertTriangle } from "@/components/Icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      padding: "var(--space-2xl)",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "var(--space-md)" }}><IconAlertTriangle size={48} /></div>
      <h2 className="section-title">Something went wrong!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)", maxWidth: "500px" }}>
        We apologize for the inconvenience. An unexpected error has occurred on our end.
      </p>
      <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
        <button
          className="btn"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Return Home
        </Link>
      </div>
    </div>
  );
}
