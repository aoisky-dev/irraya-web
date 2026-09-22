"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ReviewList } from "@/components/ReviewList";
import { useWishlist } from "@/components/WishlistProvider";
import type { Product, ProductVariant } from "@/lib/types";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);

  // Get unique sizes and colors
  const sizes = useMemo(() => {
    return [...new Set(product.variants.map((v) => v.size))];
  }, [product]);

  const colors = useMemo(() => {
    return [...new Set(product.variants.map((v) => v.color))];
  }, [product]);

  const handleSizeSelect = (size: string) => {
    const color = selectedVariant?.color;
    const match =
      product.variants.find((v) => v.size === size && v.color === color) ||
      product.variants.find((v) => v.size === size);
    if (match) setSelectedVariant(match);
  };

  const handleColorSelect = (color: string) => {
    const size = selectedVariant?.size;
    const match =
      product.variants.find((v) => v.color === color && v.size === size) ||
      product.variants.find((v) => v.color === color);
    if (match) setSelectedVariant(match);
  };

  const renderStars = (rating: number = 5) => {
    return (
      <div style={{ display: "flex", gap: "2px", color: "var(--accent-warm)" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "★" : "☆"}</span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/products" },
        { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
        { label: product.title }
      ]} />

      <section className="pdp-layout">
        {/* Image Gallery */}
        <div className="pdp-images">
          {/* Main Image */}
          <div className="pdp-image-main">
            {allImages.length > 0 ? (
              <>
                <div 
                  style={{ 
                    display: "flex", 
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)", 
                    transform: `translateX(-${selectedImage * 100}%)`,
                    height: "100%",
                    width: "100%"
                  }}
                >
                  {allImages.map((src, index) => (
                    <div key={index} style={{ minWidth: "100%", flexShrink: 0, height: "100%", position: "relative" }}>
                      <Image
                        src={src}
                        alt={`${product.title} — image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
                {allImages.length > 1 && (
                  <>
                    <button
                      className="pdp-nav-btn prev"
                      onClick={() => setSelectedImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      aria-label="Previous image"
                    >
                      &#10094;
                    </button>
                    <button
                      className="pdp-nav-btn next"
                      onClick={() => setSelectedImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      aria-label="Next image"
                    >
                      &#10095;
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="card-image-placeholder" style={{ height: "100%" }}>✦</div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="pdp-image-thumbs">
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`pdp-image-thumb${selectedImage === i ? " active" : ""}`}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  aria-label={`View image ${i + 1}`}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", background: "var(--bg-secondary)" }}>
                    <Image
                      src={src}
                      alt={`${product.title} thumbnail ${i + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="120px"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pdp-info">
          <span className="pdp-category">{product.category}</span>
          <h1 className="pdp-title">{product.title}</h1>

          {product.rating !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
              {renderStars(product.rating)}
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                ({product.reviewsCount || 0} reviews)
              </span>
            </div>
          )}

          {selectedVariant && (
            <div style={{ marginBottom: "var(--space-md)" }}>
              <p className="pdp-price" style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {formatMoney(selectedVariant.priceInCents, "inr")}
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>(incl. GST)</span>
              </p>
              <span className="text-muted" style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                Free shipping on all orders
              </span>
            </div>
          )}

          <p className="pdp-desc">{product.description}</p>

          {/* Stock status */}
          {selectedVariant && (
            <div className="stock-status">
              {selectedVariant.stock > 10 ? (
                <span className="badge badge-success">In Stock</span>
              ) : selectedVariant.stock > 0 ? (
                <span className="badge badge-warning">
                  Only {selectedVariant.stock} left
                </span>
              ) : (
                <span className="badge" style={{ background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error)" }}>
                  Out of Stock
                </span>
              )}
            </div>
          )}

          <hr className="pdp-divider" />

          {/* Size Selection */}
          {sizes.filter(s => s !== "Default").length > 0 && (
            <div className="pdp-variants">
              <h3>Size</h3>
              <div className="variant-options">
                {sizes.filter(s => s !== "Default").map((size) => (
                  <button
                    key={size}
                    className={`variant-chip ${selectedVariant?.size === size ? "active" : ""}`}
                    onClick={() => handleSizeSelect(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {colors.filter(c => c !== "Default").length > 0 && (
            <div className="pdp-variants">
              <h3>Color</h3>
              <div className="variant-options">
                {colors.filter(c => c !== "Default").map((color) => (
                  <button
                    key={color}
                    className={`variant-chip ${selectedVariant?.color === color ? "active" : ""}`}
                    onClick={() => handleColorSelect(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pdp-actions" style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
            {selectedVariant ? (
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant.id}
                title={product.title}
                image={product.image}
                size={selectedVariant.size}
                color={selectedVariant.color}
              />
            ) : (
              <button className="btn btn-lg" style={{ flex: 1, opacity: 0.5 }} disabled>
                Select a variant
              </button>
            )}
            <button
              onClick={() => {
                if (isSaved) removeFromWishlist(product.id);
                else addToWishlist(product);
              }}
              className="btn-icon"
              style={{
                width: "48px",
                height: "48px",
                fontSize: "1.4rem",
                color: isSaved ? "var(--error)" : "var(--text-secondary)",
                flexShrink: 0
              }}
              aria-label="Toggle Wishlist"
            >
              {isSaved ? "♥" : "♡"}
            </button>
          </div>

          <hr className="pdp-divider" />

          {/* Product Meta */}
          <div className="pdp-meta">
            {product.metadata?.material && (
              <div className="pdp-meta-item">
                <span>✦</span>
                <span>{product.metadata.material}</span>
              </div>
            )}
            <div className="pdp-meta-item">
              <span>↻</span>
              <span>7-Day Exchange Only</span>
            </div>
            <div className="pdp-meta-item">
              <span>◇</span>
              <span>Free Shipping ₹5,000+</span>
            </div>
            <div className="pdp-meta-item">
              <span>♡</span>
              <span>Ethically Made</span>
            </div>
          </div>

          {/* Product FAQ */}
          <FAQAccordion
            items={[
              { question: "What is the sizing like?", answer: "Our products run true to size. If you are between sizes, we recommend sizing up for a more relaxed fit." },
              { question: "How do I care for this item?", answer: "Machine wash cold with like colors. Tumble dry low or hang dry to preserve the fabric quality and longevity." },
              { question: "What is your exchange policy?", answer: "We offer a 7-day exchange policy. No returns are accepted. To process an exchange, you must provide clear images or a video of the damaged product." }
            ]}
          />
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section style={{ marginTop: "var(--space-4xl)", padding: "var(--space-2xl)", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
        <div className="section-header">
          <h2 className="section-title">Customer Reviews</h2>
          {product.rating !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{product.rating}</span>
              {renderStars(Math.round(product.rating))}
            </div>
          )}
        </div>
        <ReviewList productId={product.id} initialReviews={[]} />
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: "var(--space-4xl)" }}>
          <div className="section-header">
            <h2 className="section-title">You May Also Like</h2>
            <Link href="/products" className="section-link">View all →</Link>
          </div>
          <div className="grid">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
