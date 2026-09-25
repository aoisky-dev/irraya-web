"use client";

import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/components/WishlistProvider";
import { useCompare } from "@/components/CompareProvider";
import { getStockLabel, getTotalStock } from "@/lib/catalog";
import { productAltText } from "@/lib/seo";
import { IconHeart, IconHeartFilled, IconImage } from "@/components/Icons";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryVariant = product.variants[0];
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const isSaved = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product page
    if (isSaved) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCompared) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const totalStock = getTotalStock(product);
  const stock = getStockLabel(product);

  return (
    <Link href={`/products/${product.handle}`} className="card" id={`product-${product.handle}`}>
      <div className="card-image" style={{ position: "relative" }}>
        {product.image ? (
          <Image src={product.image} alt={productAltText(product)} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="card-image-placeholder"><IconImage size={24} /></div>
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
          {isSaved ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
        </button>
        <button 
          onClick={toggleCompare}
          className="compare-btn-absolute"
          aria-label={isCompared ? "Remove from compare" : "Add to compare"}
          style={{
            position: "absolute",
            top: "calc(var(--space-md) + 40px)",
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
            color: isCompared ? "var(--primary)" : "var(--text-muted)",
            fontSize: "1.1rem"
          }}
        >
          {isCompared ? "⌸" : "⌧"}
        </button>
        {totalStock <= 5 && totalStock > 0 && (
          <span className="card-badge badge-low-stock">Low Stock</span>
        )}
        {totalStock <= 0 && (
          <span className="card-badge badge-low-stock">Out of Stock</span>
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
        <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "var(--space-xs)" }}>
          {stock.label}{product.rating ? ` · ★ ${product.rating} (${product.reviewsCount ?? 0})` : ""}
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
