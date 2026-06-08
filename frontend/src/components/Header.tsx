"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/lib/types";

export function Header() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      getProducts({ q: searchQuery.trim() })
        .then(products => setSuggestions(products.slice(0, 5)))
        .catch(() => setSuggestions([]));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="container nav-row">
        <Link href="/" className="brand-logo" aria-label="Irraya Fashion Home">
          <span className="brand-arc" />
          <span className="brand-name">Irraya</span>
          <span className="brand-tagline">Fashion · Lifestyle · Culture</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
          <form ref={searchRef} onSubmit={handleSearch} style={{ display: 'flex', position: 'relative' }} className="search-form">
            <input 
              type="search" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
              className="input"
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-md)',
                borderRadius: 'var(--radius-md)',
                marginTop: '4px',
                zIndex: 100,
                border: '1px solid var(--border-light)',
                overflow: 'hidden'
              }}>
                {suggestions.map(p => (
                  <Link 
                    key={p.id} 
                    href={`/products/${p.handle}`}
                    onClick={() => { setShowSuggestions(false); setSearchQuery(""); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm)',
                      borderBottom: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                    className="hover-bg-secondary"
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.title} style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                    ) : (
                      <div style={{ width: '32px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>
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
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
        </nav>
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
          <form onSubmit={handleSearch} style={{ padding: 'var(--space-md)' }}>
            <input 
              type="search" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.5rem', marginBottom: 'var(--space-sm)' }}
            />
          </form>
          <nav onClick={() => setMobileOpen(false)} style={{ display: 'flex', flexDirection: 'column' }}>
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
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
