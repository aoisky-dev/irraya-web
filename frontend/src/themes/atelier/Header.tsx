"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { useAuth } from "@/components/AuthProvider";
import { useSale } from "@/components/SaleProvider";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SearchTypeaheadModal } from "@/components/SearchTypeaheadModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const COLLECTION_CATEGORIES = [
  { name: "Dresses", href: "/products?category=dresses", desc: "Effortless silhouettes & flowing cuts" },
  { name: "Co-ords", href: "/products?category=co-ords", desc: "Curated matching sets for effortless styling" },
  { name: "Tops & Shirts", href: "/products?category=tops", desc: "Tailored cottons, linens & daily staples" },
  { name: "Trousers & Pants", href: "/products?category=trousers", desc: "Relaxed silhouettes & tailored trousers" },
  { name: "Outerwear", href: "/products?category=outerwear", desc: "Structured layers & transitional jackets" },
  { name: "Knitwear", href: "/products?category=knitwear", desc: "Soft breathable knits for every season" },
];

export function Header() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const { hasActiveSale } = useSale();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setCollectionsDropdownOpen(false);
  }, [pathname]);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const wishlistCount = wishlist?.length ?? 0;
  const profileHref = user ? "/account" : "/login?next=%2Faccount";

  const handleCollectionsMouseEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setCollectionsDropdownOpen(true);
  };

  const handleCollectionsMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setCollectionsDropdownOpen(false);
    }, 150);
  };

  // Route active checkers
  const isShopActive = pathname === "/products" && !pathname.includes("sort=sale");
  const isCollectionsActive = pathname.startsWith("/collections");
  const isAboutActive = pathname.startsWith("/about");
  const isSaleActive = pathname.includes("sort=sale");

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        <AnnouncementBar />

        <div className="container">
          <div className="nav-row">
            {/* Left nav */}
            <nav className="header-left" aria-label="Primary navigation">
              <Link
                href="/products"
                className={isShopActive ? "nav-link--active" : ""}
                aria-current={isShopActive ? "page" : undefined}
              >
                Shop
              </Link>

              {/* Collections with Hover Mega Dropdown */}
              <div
                className="nav-has-dropdown"
                onMouseEnter={handleCollectionsMouseEnter}
                onMouseLeave={handleCollectionsMouseLeave}
              >
                <Link
                  href="/collections"
                  className={isCollectionsActive ? "nav-link--active" : ""}
                  aria-current={isCollectionsActive ? "page" : undefined}
                >
                  Collections
                </Link>

                <div className={`nav-mega-dropdown ${collectionsDropdownOpen ? "is-open" : ""}`} role="menu">
                  <div className="mega-dropdown-grid">
                    {COLLECTION_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="mega-dropdown-item"
                        onClick={() => setCollectionsDropdownOpen(false)}
                      >
                        <span className="mega-dropdown-title">{cat.name}</span>
                        <span className="mega-dropdown-desc">{cat.desc}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mega-dropdown-footer">
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Crafted with natural fabrics &amp; timeless cuts
                    </span>
                    <Link
                      href="/collections"
                      className="mega-dropdown-all-link"
                      onClick={() => setCollectionsDropdownOpen(false)}
                    >
                      View All Collections →
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/about"
                className={isAboutActive ? "nav-link--active" : ""}
                aria-current={isAboutActive ? "page" : undefined}
              >
                Story
              </Link>

              {/* Dynamic Sale nav link */}
              {hasActiveSale && (
                <Link
                  href="/products?sort=sale"
                  className={`nav-sale-link ${isSaleActive ? "nav-link--active" : ""}`}
                  aria-current={isSaleActive ? "page" : undefined}
                >
                  <span className="sale-pulse-dot" />
                  Sale
                </Link>
              )}
            </nav>

            {/* Centre brand */}
            <Link href="/" className="brand-logo" aria-label="Irraya Fashion Home">
              <Image src="/logo.png" alt="Irraya Logo" width={140} height={44} priority style={{ objectFit: 'contain' }} />
            </Link>

            {/* Right actions */}
            <div className="header-right">
              {/* Desktop Search Button */}
              <button
                type="button"
                className="icon-link desktop-only"
                aria-label="Search products"
                onClick={() => setSearchOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="16.65" y1="16.65" x2="21" y2="21"/>
                </svg>
              </button>

              {/* Wishlist Link with live count badge */}
              <Link
                href="/wishlist"
                className="icon-link icon-with-badge"
                aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
              </Link>

              {/* Shopping Bag with count badge */}
              <Link
                href="/cart"
                className="icon-link icon-with-badge"
                aria-label={`Shopping bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>

              {/* Profile icon */}
              <Link
                href={profileHref}
                className="icon-link desktop-only"
                aria-label={user ? "My account" : "Sign in"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 21c1.7-3.5 4.4-5 8-5s6.3 1.5 8 5"/>
                </svg>
              </Link>
            </div>

            {/* Mobile hamburger and search */}
            <div className="mobile-left-actions">
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
              <button
                type="button"
                className="icon-link mobile-only"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="16.65" y1="16.65" x2="21" y2="21"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-out nav drawer */}
        {mobileOpen && (
          <div className="mobile-nav">
            <nav onClick={() => setMobileOpen(false)}>
              <Link
                href="/products"
                className={isShopActive ? "mobile-nav-link--active" : ""}
              >
                Shop All
              </Link>
              <Link
                href="/collections"
                className={isCollectionsActive ? "mobile-nav-link--active" : ""}
              >
                Collections
              </Link>
              {hasActiveSale && (
                <Link
                  href="/products?sort=sale"
                  style={{ color: "var(--accent-warm, #712119)", fontWeight: 700 }}
                >
                  Sale 🔥
                </Link>
              )}
              <Link
                href="/about"
                className={isAboutActive ? "mobile-nav-link--active" : ""}
              >
                Story
              </Link>
              <Link href="/wishlist">
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </Link>
              <Link href={profileHref}>
                {user ? "My Account" : "Sign In / Register"}
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" style={{ color: "var(--text-muted)" }}>
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Global Search Typeahead Modal */}
      <SearchTypeaheadModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar (Fixed for mobile screens) */}
      <MobileBottomNav
        onOpenSearch={() => setSearchOpen(true)}
      />
    </>
  );
}
