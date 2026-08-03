import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1>Page Not Found</h1>
      <p>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn">
          Back to Home
        </Link>
        <Link href="/products" className="btn btn-secondary">
          Browse Products
        </Link>
      </div>
    </div>
  );
}
