"use client";

import { useWishlist } from "@/components/WishlistProvider";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <main className="container" style={{ padding: "var(--space-4xl) 0" }}>
      <header className="section-header">
        <h1 className="section-title">Your Wishlist</h1>
        <p className="text-muted" style={{ marginTop: "8px" }}>
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
        </p>
      </header>

      {wishlist.length === 0 ? (
        <div className="cart-empty" style={{ padding: "var(--space-5xl) 0" }}>
          <h2>Your wishlist is empty</h2>
          <p>Save items you love to review them later.</p>
          <Link href="/products" className="btn btn-primary" style={{ marginTop: "var(--space-xl)" }}>
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
