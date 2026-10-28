"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { useAuth } from "@/components/AuthProvider";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SearchTypeaheadModal } from "@/components/SearchTypeaheadModal";


import { getStoreCollections, type StoreCollectionItem } from "@/lib/api/products";

const INITIAL_COLLECTIONS: StoreCollectionItem[] = [
  {
    id: "pcol_01M2FSW1RWTMXQCS0JAJJQSQXP",
    name: "Alpana",
    handle: "alpana",
    href: "/products?category=Alpana",
    count: 7,
    image: "https://api.irraya.com/uploads/1791706445464-IMG_4890.jpeg",
    desc: "Mul Chanderi Collection · 7 pieces"
  },
  {
    id: "pcol_01M2F3EC9WNA6KMHQVGRAW4ZB3",
    name: "Kiran",
    handle: "Kiran",
    href: "/products?category=Kiran",
    count: 7,
    image: "https://api.irraya.com/uploads/1790092783985-IMG_4549.jpeg",
    desc: "Modal cotton Collection · 7 pieces"
  }
];

export function Header() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
  const [collections, setCollections] = useState<StoreCollectionItem[]>(INITIAL_COLLECTIONS);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch collections dynamically from Medusa store API
  useEffect(() => {
    getStoreCollections()
      .then((cols) => {
        if (cols && cols.length > 0) {
          setCollections(cols);
        }
      })
      .catch((err) => console.error("Error loading nav collections:", err));
  }, []);

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
  const isShopActive = pathname === "/products";
  const isCollectionsActive = pathname.startsWith("/collections");
  const isAboutActive = pathname.startsWith("/about");

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
                    {collections.map((col) => (
                      <Link
                        key={col.id}
                        href={col.href}
                        className="mega-dropdown-item"
                        onClick={() => setCollectionsDropdownOpen(false)}
                      >
                        <div className="mega-dropdown-item-content">
                          {col.image && (
                            <div className="mega-dropdown-thumbnail">
                              <Image
                                src={col.image}
                                alt={col.name}
                                fill
                                sizes="50px"
                                style={{ objectFit: "cover", objectPosition: "center top" }}
                              />
                            </div>
                          )}
                          <div className="mega-dropdown-text">
                            <span className="mega-dropdown-title">{col.name}</span>
                            <span className="mega-dropdown-desc">{col.desc}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mega-dropdown-footer">
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Consciously crafted with natural fabrics &amp; artisanal detailing
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
              <div className="mobile-nav-collection-group">
                <Link
                  href="/collections"
                  className={isCollectionsActive ? "mobile-nav-link--active" : ""}
                >
                  Collections
                </Link>
                {collections.length > 0 && (
                  <div className="mobile-nav-sublinks">
                    {collections.map((col) => (
                      <Link
                        key={col.id}
                        href={col.href}
                        className="mobile-nav-sublink"
                      >
                        <span>{col.name}</span>
                        <span className="mobile-nav-sublink-count">({col.count})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
    </>
  );
}
