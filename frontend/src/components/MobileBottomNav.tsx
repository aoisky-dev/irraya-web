"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { IconHome, IconGrid, IconSearch, IconHeart, IconUser } from "@/components/Icons";

interface MobileBottomNavProps {
  onOpenSearch: () => void;
}

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { wishlist } = useWishlist();

  const wishlistCount = wishlist?.length ?? 0;
  const profileHref = user ? "/account" : "/login?next=%2Faccount";

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/products") || pathname.startsWith("/collections");
  const isWishlist = pathname.startsWith("/wishlist");
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <Link
        href="/"
        className={`mobile-nav-item ${isHome ? "mobile-nav-item--active" : ""}`}
        aria-current={isHome ? "page" : undefined}
      >
        <span className="mobile-nav-icon">
          <IconHome size={20} />
        </span>
        <span className="mobile-nav-label">Home</span>
      </Link>

      <Link
        href="/products"
        className={`mobile-nav-item ${isShop ? "mobile-nav-item--active" : ""}`}
        aria-current={isShop ? "page" : undefined}
      >
        <span className="mobile-nav-icon">
          <IconGrid size={20} />
        </span>
        <span className="mobile-nav-label">Shop</span>
      </Link>

      <button
        type="button"
        className="mobile-nav-item mobile-nav-btn"
        onClick={onOpenSearch}
        aria-label="Open search"
      >
        <span className="mobile-nav-icon">
          <IconSearch size={20} />
        </span>
        <span className="mobile-nav-label">Search</span>
      </button>

      <Link
        href="/wishlist"
        className={`mobile-nav-item ${isWishlist ? "mobile-nav-item--active" : ""}`}
        aria-current={isWishlist ? "page" : undefined}
      >
        <span className="mobile-nav-icon">
          <IconHeart size={20} />
          {wishlistCount > 0 && <span className="mobile-nav-badge">{wishlistCount}</span>}
        </span>
        <span className="mobile-nav-label">Wishlist</span>
      </Link>

      <Link
        href={profileHref}
        className={`mobile-nav-item ${isAccount ? "mobile-nav-item--active" : ""}`}
        aria-current={isAccount ? "page" : undefined}
      >
        <span className="mobile-nav-icon">
          <IconUser size={20} />
        </span>
        <span className="mobile-nav-label">{user ? "Account" : "Login"}</span>
      </Link>
    </nav>
  );
}
