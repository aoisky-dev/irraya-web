"use client";

import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/components/WishlistProvider";
import { getStockLabel, getTotalStock } from "@/lib/catalog";
import { productAltText } from "@/lib/seo";
import { IconImage } from "@/components/Icons";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryVariant = product.variants[0];
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);
  const totalStock = getTotalStock(product);
  const stock = getStockLabel(product);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    isSaved ? removeFromWishlist(product.id) : addToWishlist(product);
  };

  return (
    <Link href={`/products/${product.handle}`} className="card" id={`product-${product.handle}`}>
      <div className="card-image">
        {product.image ? (
          <Image
            src={product.image}
            alt={productAltText(product)}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="card-image-placeholder"><span><IconImage size={24} /></span></div>
        )}

        {totalStock <= 0 && <span className="card-badge badge-out-of-stock">Sold Out</span>}
        {totalStock > 0 && totalStock <= 5 && (
          <span className="card-badge badge-low-stock">Only {totalStock} left</span>
        )}

        <div className="card-overlay"><span>View Product</span></div>

        <div className="card-actions">
          <button
            onClick={toggleWishlist}
            className={`card-action-btn${isSaved ? " active" : ""}`}
            aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="card-category">{product.category}</span>
          {product.rating && <span className="card-rating">★ {product.rating}</span>}
        </div>
        <h3 className="card-title">{product.title}</h3>
        <div className="card-footer-row">
          <span className="card-price">
            {primaryVariant ? formatMoney(primaryVariant.priceInCents, "inr") : "—"}
          </span>
          {product.variants.length > 1 && (
            <span className="card-variants">{product.variants.length} options</span>
          )}
        </div>
        <p className="card-stock text-muted">{stock.label}</p>
      </div>
    </Link>
  );
}
