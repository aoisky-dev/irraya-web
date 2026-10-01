"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ReviewList } from "@/components/ReviewList";
import { useWishlist } from "@/components/WishlistProvider";
import { SizeChartModal } from "@/components/SizeChartModal";
import { ShareButton } from "@/components/ShareButton";
import { PincodeChecker } from "@/components/PincodeChecker";
import type { Product, ProductVariant } from "@/lib/types";
import { config } from "@/lib/config";
import { IconHeart, IconHeartFilled, IconRefreshCw, IconStar, IconDiamond, IconImage, IconMail, IconPhone, IconWhatsApp, IconTruck } from "@/components/Icons";
import { applySaleDiscount } from "@/lib/api/sale";
import { useSale } from "@/components/SaleProvider";

// Metadata keys already surfaced elsewhere in the page (badges, category, SEO)
// so they are excluded from the generic "Product Details" list below.
const KNOWN_METADATA_KEYS = new Set([
  "category",
  "rating",
  "reviews_count",
  "reviewscount",
  "metatitle",
  "meta_title",
  "metadescription",
  "meta_description"
]);

const formatMetadataLabel = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);
  const { getSale } = useSale();
  const sale = getSale(product.id);

  const maxQuantity = Math.max(1, Math.min(selectedVariant?.stock ?? 1, 10));

  const changeQuantity = (delta: number) => {
    setQuantity((prev) => Math.min(maxQuantity, Math.max(1, prev + delta)));
  };

  // Get unique sizes and colors
  const sizes = useMemo(() => {
    const SIZE_ORDER: Record<string, number> = {
      "xxs": 1,
      "xs": 2,
      "s": 3,
      "m": 4,
      "l": 5,
      "xl": 6,
      "xxl": 7,
      "2xl": 7,
      "xxxl": 8,
      "3xl": 8,
    };
    const uniqueSizes = [...new Set(product.variants.map((v) => v.size))];
    return uniqueSizes.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aOrder = SIZE_ORDER[aLower] || 99;
      const bOrder = SIZE_ORDER[bLower] || 99;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [product]);

  const colors = useMemo(() => {
    return [...new Set(product.variants.map((v) => v.color))];
  }, [product]);

  // Fabric/material can come from Medusa's native product.material field, or
  // (as a fallback) from metadata under a few different key names depending
  // on how it was entered in Medusa Admin.
  const materialLabel = useMemo(() => {
    const metadata = product.metadata ?? {};
    const value = product.material || metadata.material || metadata.fabric || metadata.fabric_type || metadata.fabricType;
    return value?.trim() || undefined;
  }, [product]);

  // Any other backend-added product metadata (fabric, pattern, care, fit,
  // origin, etc.) that isn't already surfaced elsewhere on the page.
  const additionalDetails = useMemo(() => {
    const metadata = product.metadata ?? {};
    const details: [string, string][] = [];

    Object.entries(metadata).forEach(([key, value]) => {
      if (!value) return;
      if (KNOWN_METADATA_KEYS.has(key.toLowerCase())) return;
      details.push([key, String(value)]);
    });

    return details;
  }, [product]);

  const handleSizeSelect = (size: string) => {
    const color = selectedVariant?.color;
    const match =
      product.variants.find((v) => v.size === size && v.color === color) ||
      product.variants.find((v) => v.size === size);
    if (match) {
      setSelectedVariant(match);
      setQuantity((prev) => Math.min(prev, Math.max(1, Math.min(match.stock, 10))));
    }
  };

  const handleColorSelect = (color: string) => {
    const size = selectedVariant?.size;
    const match =
      product.variants.find((v) => v.color === color && v.size === size) ||
      product.variants.find((v) => v.color === color);
    if (match) {
      setSelectedVariant(match);
      setQuantity((prev) => Math.min(prev, Math.max(1, Math.min(match.stock, 10))));
    }
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
                    <div 
                      key={index} 
                      style={{ minWidth: "100%", flexShrink: 0, height: "100%", position: "relative", cursor: "zoom-in" }}
                      onClick={() => {
                        setSelectedImage(index);
                        setIsFullScreen(true);
                      }}
                    >
                      <Image
                        src={src}
                        alt={`${product.title} — image ${index + 1}`}
                        fill
                        style={{ objectFit: "contain" }}
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
              <div className="card-image-placeholder" style={{ height: "100%" }}><IconImage size={24} /></div>
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
              {(() => {
                const salePrice = applySaleDiscount(selectedVariant.priceInCents, sale);
                return (
                  <p className="pdp-price" style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {salePrice !== undefined ? (
                      <>
                        <span style={{ color: "var(--accent-warm, #e11d48)" }}>{formatMoney(salePrice, "inr")}</span>
                        <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.85em", fontWeight: 400 }}>
                          {formatMoney(selectedVariant.priceInCents, "inr")}
                        </span>
                        <span style={{ background: "var(--accent-warm, #e11d48)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
                          {sale?.label || `${sale?.discountPct}% OFF`}
                        </span>
                      </>
                    ) : (
                      <>
                        {formatMoney(selectedVariant.priceInCents, "inr")}
                      </>
                    )}
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>(incl. GST)</span>
                  </p>
                );
              })()}
              <span className="text-muted" style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                Free shipping on all orders
              </span>
              <span className="text-muted" style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                <IconTruck size={14} />
                Estimated delivery: 7–10 business days
              </span>
            </div>
          )}

          <div className="pdp-desc markdown-content">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

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
              <div className="size-selector-layout">
                <div className="variant-options" style={{ marginBottom: 0, width: "100%" }}>
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
                <div style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                  <SizeChartModal />
                </div>
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

          {/* Quantity Selector & Secondary Actions */}
          {selectedVariant && (
            <div className="pdp-variants" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3>Quantity</h3>
                <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 6px)" }}>
                  <button
                    type="button"
                    onClick={() => changeQuantity(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    style={{ width: "36px", height: "36px", background: "none", border: "none", cursor: quantity <= 1 ? "not-allowed" : "pointer", fontSize: "1.1rem", opacity: quantity <= 1 ? 0.4 : 1 }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next)) {
                        setQuantity(Math.min(maxQuantity, Math.max(1, Math.round(next))));
                      }
                    }}
                    aria-label="Quantity"
                    className="qty-input"
                    style={{
                      width: "48px",
                      height: "36px",
                      textAlign: "center",
                      border: "none",
                      background: "none",
                      color: "var(--text-primary)",
                      fontSize: "1rem",
                      lineHeight: "36px",
                      padding: 0
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => changeQuantity(1)}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    style={{ width: "36px", height: "36px", background: "none", border: "none", cursor: quantity >= maxQuantity ? "not-allowed" : "pointer", fontSize: "1.1rem", opacity: quantity >= maxQuantity ? 0.4 : 1 }}
                  >
                    +
                  </button>
                </div>
                {selectedVariant.stock > 0 && selectedVariant.stock <= 10 && (
                  <div className="text-muted" style={{ marginTop: "4px", fontSize: "0.8rem" }}>
                    Max {maxQuantity} per order
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
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
                  {isSaved ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                </button>
                <ShareButton title={product.title} text={`Check out ${product.title} on Irraya Fashion`} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pdp-actions" style={{ display: "flex", flexDirection: "row", gap: "var(--space-md)", alignItems: "stretch", width: "100%" }}>
            {selectedVariant ? (
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant.id}
                handle={product.handle}
                title={product.title}
                image={product.image}
                size={selectedVariant.size}
                color={selectedVariant.color}
                quantity={quantity}
              />
            ) : (
              <button className="btn btn-lg" style={{ flex: 1, opacity: 0.5 }} disabled>
                Select a variant
              </button>
            )}
          </div>

          <PincodeChecker />

          <hr className="pdp-divider" />

          {/* Product Meta */}
          <div className="pdp-meta">
            <div className="pdp-meta-item">
              <span><IconRefreshCw size={14} /></span>
              <span>48-Hour Exchange Only</span>
            </div>
            <div className="pdp-meta-item">
              <span><IconDiamond size={14} /></span>
              <span>Free Shipping</span>
            </div>
            <div className="pdp-meta-item">
              <span><IconHeart size={14} /></span>
              <span>Ethically Made</span>
            </div>
          </div>

          {/* Additional product details (fabric, pattern, care, fit, origin, etc.) */}
          {additionalDetails.length > 0 && (
            <div style={{ marginTop: "var(--space-lg)" }}>
              <h3 style={{ marginBottom: "var(--space-sm)" }}>Product Details</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", rowGap: "6px", columnGap: "var(--space-md)", margin: 0 }}>
                {additionalDetails.map(([key, value]) => (
                  <React.Fragment key={key}>
                    <dt style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{formatMetadataLabel(key)}</dt>
                    <dd style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>{value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          )}

          {/* Product FAQ */}
          <FAQAccordion
            items={[
              { question: "What is the sizing like?", answer: "Our products run true to size. If you are between sizes, we recommend sizing up for a more relaxed fit." },
              { question: "How do I care for this item?", answer: "Hand wash gently in cold/normal water with mild detergent.\nDo not machine wash, bleach, soak, or wring.\nDry in shade and iron on low heat, preferably inside out.\nFor delicate garments, professional dry cleaning is recommended." },
              { question: "What is your exchange policy?", answer: "We accept exchanges only in case of a damaged or defective product.\n\n• Please share clear photos and an unedited video showing the damage within 48 hours of delivery.\n• The product must be unused, unworn, unwashed, and with all original tags intact.\n• Requests received after 48 hours of delivery will not be eligible for exchange.\n• Once the issue is verified and approved by our team, we will guide you through the exchange process.\n\nPlease make sure to record a video while opening the package for a smooth verification process." }
            ]}
          />
        </div>
      </section>

      {/* Customization / Contact Section */}
      <section
        style={{
          marginTop: "var(--space-4xl)",
          padding: "var(--space-2xl)",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-lg)",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div>
          <h2 className="section-title" style={{ marginBottom: "var(--space-xs)" }}>Want a Custom Fit or Design?</h2>
          <p className="text-muted" style={{ maxWidth: "48ch" }}>
            Reach out to us for customization requests on this piece — sizing tweaks, fabric preferences, or bespoke designs.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-md)" }}>
          <a
            href={`mailto:${config.contactEmail}?subject=${encodeURIComponent(`Customization request — ${product.title}`)}`}
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <IconMail size={16} /> {config.contactEmail}
          </a>
          <a
            href={`tel:${config.contactPhone.replace(/\s+/g, "")}`}
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <IconPhone size={16} /> {config.contactPhone}
          </a>
          <a
            href={`https://wa.me/${config.whatsAppNumber}?text=${encodeURIComponent(`Hi, I'd like to customize "${product.title}".`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <IconWhatsApp size={16} /> WhatsApp
          </a>
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

      {/* Fullscreen Image Modal */}
      {isFullScreen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "#ffffff", zIndex: 9999, display: "flex", flexDirection: "column"
        }}>
          <button 
            onClick={() => { setZoomLevel(1); setIsFullScreen(false); }}
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#000000", fontSize: "3rem", lineHeight: 1, cursor: "pointer", zIndex: 10000, padding: "10px" }}
            aria-label="Close fullscreen"
          >
            &times;
          </button>
          
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div style={{ 
              display: "flex", 
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)", 
              transform: `translateX(-${selectedImage * 100}%)`,
              height: "100%",
              width: "100%"
            }}>
              {allImages.map((src, index) => (
                <div 
                  key={index} 
                  style={{ 
                    minWidth: "100%", flexShrink: 0, height: "100%", position: "relative",
                    overflow: selectedImage === index && zoomLevel > 1 ? "auto" : "hidden",
                    cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in"
                  }}
                  onClick={(e) => {
                    if (selectedImage !== index) return;
                    if (zoomLevel > 1) {
                      setZoomLevel(1);
                    } else {
                      const targetZoom = 2.5;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const xRatio = (e.clientX - rect.left) / rect.width;
                      const yRatio = (e.clientY - rect.top) / rect.height;
                      
                      setZoomLevel(targetZoom);
                      
                      const container = e.currentTarget;
                      setTimeout(() => {
                        const targetScrollLeft = (xRatio * container.scrollWidth) - (container.clientWidth / 2);
                        const targetScrollTop = (yRatio * container.scrollHeight) - (container.clientHeight / 2);
                        
                        container.scrollTo({
                          left: targetScrollLeft,
                          top: targetScrollTop,
                          behavior: "instant"
                        });
                      }, 0);
                    }
                  }}
                >
                  <div style={{ 
                    width: selectedImage === index ? `${zoomLevel * 100}%` : "100%", 
                    height: selectedImage === index ? `${zoomLevel * 100}%` : "100%", 
                    minWidth: "100%", minHeight: "100%",
                    position: "relative"
                  }}>
                    <Image
                      src={src}
                      alt={`${product.title} fullscreen — image ${index + 1}`}
                      fill
                      style={{ objectFit: "contain", padding: zoomLevel === 1 ? "40px" : "0" }}
                      sizes="100vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel(1); setSelectedImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1)); }}
                style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.05)", border: "none", color: "#000000", fontSize: "2rem", width: "60px", height: "60px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10000 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
              >
                &#10094;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel(1); setSelectedImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1)); }}
                style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.05)", border: "none", color: "#000000", fontSize: "2rem", width: "60px", height: "60px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10000 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
              >
                &#10095;
              </button>
            </>
          )}

          {/* Zoom Controls */}
          <div style={{ position: "absolute", bottom: "120px", right: "20px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 10000 }}>
            <button onClick={() => setZoomLevel(p => Math.min(p + 0.5, 4))} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#000000", fontSize: "1.5rem", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")} aria-label="Zoom in">
              +
            </button>
            <button onClick={() => setZoomLevel(p => Math.max(p - 0.5, 1))} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#000000", fontSize: "1.5rem", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")} aria-label="Zoom out">
              -
            </button>
          </div>
          
          {/* Thumbnail strip in fullscreen */}
          {allImages.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "20px", background: "transparent", zIndex: 10000 }}>
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => { setZoomLevel(1); setSelectedImage(i); }}
                  style={{ 
                    position: "relative", width: "60px", height: "60px", 
                    border: selectedImage === i ? "2px solid #000000" : "2px solid transparent", 
                    background: "none", padding: 0, cursor: "pointer", opacity: selectedImage === i ? 1 : 0.4,
                    transition: "opacity 0.2s, border 0.2s"
                  }}
                  onMouseEnter={(e) => { if (selectedImage !== i) e.currentTarget.style.opacity = "0.7"; }}
                  onMouseLeave={(e) => { if (selectedImage !== i) e.currentTarget.style.opacity = "0.4"; }}
                >
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="60px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
