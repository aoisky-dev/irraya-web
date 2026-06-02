"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/components/WishlistProvider";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryVariant = product.variants[0];
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product page
    if (isSaved) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link href={`/products/${product.handle}`} className="card" id={`product-${product.handle}`}>
      <div className="card-image">
        {product.image ? (
          <img src={product.image} alt={product.title} loading="lazy" />
        ) : (
          <div className="card-image-placeholder">✦</div>
        )}
        <button 
          onClick={toggleWishlist}
          className="wishlist-btn-absolute"
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "var(--space-md)",
            right: "var(--space-md)",
            zIndex: 3,
            background: "var(--bg-card)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            color: isSaved ? "var(--error)" : "var(--text-muted)",
            fontSize: "1.1rem"
          }}
        >
          {isSaved ? "♥" : "♡"}
        </button>
        {totalStock <= 5 && totalStock > 0 && (
          <span className="card-badge badge-low-stock">Low Stock</span>
        )}
        <div className="card-overlay">
          <span>View Details →</span>
        </div>
      </div>
      <div className="card-body">
        <span className="card-category">{product.category}</span>
        <h3 className="card-title">{product.title}</h3>
        <p className="card-price">
          {primaryVariant
            ? formatMoney(primaryVariant.priceInCents, "inr")
            : "Price unavailable"}
        </p>
        {product.variants.length > 1 && (
          <span className="card-variant-count">
            {product.variants.length} variants
          </span>
        )}
      </div>
    </Link>
  );
}
