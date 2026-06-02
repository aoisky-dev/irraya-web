"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="header">
      <div className="container nav-row">
        <Link href="/" className="brand-logo" aria-label="Irraya Fashion Home">
          <span className="brand-arc" />
          <span className="brand-name">Irraya</span>
          <span className="brand-tagline">Fashion · Lifestyle · Culture</span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links">
          <Link href="/about">About</Link>
          <Link href="/products">Shop</Link>
          <Link href="/wishlist">
            Wishlist
            {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
          </Link>
          <Link href="/cart" className="cart-link">
            Cart
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
          {user ? (
            <Link href="/account">Account</Link>
          ) : (
            <Link href="/login">Login</Link>
          )}
          <Link href="/admin">Admin</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className={`hamburger ${mobileOpen ? "open" : ""}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="mobile-nav" onClick={() => setMobileOpen(false)}>
          <Link href="/about">About</Link>
          <Link href="/products">Shop</Link>
          <Link href="/wishlist">Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</Link>
          <Link href="/cart">
            Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
          {user ? (
            <Link href="/account">Account</Link>
          ) : (
            <Link href="/login">Login</Link>
          )}
          <Link href="/admin">Admin</Link>
        </nav>
      )}
    </header>
  );
}
