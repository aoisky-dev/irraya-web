"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";

export function Header() {
  const { cart } = useCart();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const profileHref = user ? "/account" : "/login?next=%2Faccount";

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>
      {/* Announcement bar */}
      <div className="header-topbar">
        <span>Free shipping on orders over ₹1,000 &nbsp;·&nbsp; New collection now live</span>
      </div>

      <div className="container">
        <div className="nav-row">
          {/* Left nav */}
          <nav className="header-left" aria-label="Primary navigation">
            <Link href="/products">Shop</Link>
            <Link href="/#categories">Collections</Link>
            <Link href="/about">Story</Link>
          </nav>

          {/* Centre brand */}
          <Link href="/" className="brand-logo" aria-label="Irraya Fashion Home">
            <span className="brand-name">Irraya</span>
            <span className="brand-tagline">Fashion · Lifestyle · Culture</span>
          </Link>

          {/* Right actions */}
          <div className="header-right">
            <Link href="/search" className="icon-link" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/>
                <line x1="16.65" y1="16.65" x2="21" y2="21"/>
              </svg>
            </Link>
            <Link href="/wishlist" className="icon-link" aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
            <Link href="/cart" className="icon-link icon-with-badge" aria-label={`Shopping bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>
            <Link href={profileHref} className="icon-link" aria-label={user ? "My account" : "Sign in"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21c1.7-3.5 4.4-5 8-5s6.3 1.5 8 5"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        <span className={`hamburger ${mobileOpen ? "open" : ""}`}>
          <span /><span /><span />
        </span>
      </button>

      {mobileOpen && (
        <div className="mobile-nav">
          <nav onClick={() => setMobileOpen(false)}>
            <Link href="/products">Shop</Link>
            <Link href="/#categories">Collections</Link>
            <Link href="/about">Story</Link>
            <Link href="/search">Search</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/cart">Bag{itemCount > 0 && ` (${itemCount})`}</Link>
            <Link href={profileHref}>{user ? "Account" : "Sign In"}</Link>
            {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
