"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { cart } = useCart();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const profileHref = user ? "/account" : "/login?next=%2Faccount";

  return (
    <header className="header">
      <div className="container nav-row">
        <div className="header-left">
          <Link href="/" className="brand-logo" aria-label="Irraya Fashion Home">
            <span className="brand-arc" />
            <span className="brand-name">Irraya</span>
            <span className="brand-tagline">Fashion · Lifestyle · Culture</span>
          </Link>
        </div>

        <nav className="header-center" aria-label="Primary">
          <Link href="/products">Products</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/about">About</Link>
        </nav>

        <div className="header-right">
          <Link href="/search" className="icon-link" aria-label="Search">
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </Link>
          <Link href="/cart" className="icon-link icon-with-badge" aria-label="Cart">
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="20" r="1.5" fill="currentColor" />
              <circle cx="18" cy="20" r="1.5" fill="currentColor" />
              <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 7H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
          <Link href={profileHref} className="icon-link" aria-label="Profile">
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M4 21c1.7-3.5 4.4-5 8-5s6.3 1.5 8 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

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
        <div className="mobile-nav">
          <nav onClick={() => setMobileOpen(false)} style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href="/products">Products</Link>
            <Link href="/#categories">Categories</Link>
            <Link href="/about">About</Link>
            <Link href="/search">Search</Link>
            <Link href="/cart">Cart {itemCount > 0 && `(${itemCount})`}</Link>
            <Link href={profileHref}>{user ? "Account" : "Login"}</Link>
            {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
