"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Carousel } from "@/components/Carousel";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ReviewList } from "@/components/ReviewList";
import { useWishlist } from "@/components/WishlistProvider";
import { getProductByHandle, getProducts } from "@/lib/api/products";
import type { Product, ProductVariant } from "@/lib/types";
import { getRecentlyViewedProducts, getRelatedProducts, trackRecentlyViewedProduct } from "@/lib/catalog";

export function ProductDetailClient({ handle }: { handle: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isSaved = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    const fetchProduct = getProductByHandle(handle);
    const fetchAll = getProducts();

    Promise.all([fetchProduct, fetchAll])
      .then(([prod, all]) => {
        setProduct(prod);
        setAllProducts(all);
        setRecentlyViewed(getRecentlyViewedProducts().filter((item) => item.handle !== handle).slice(0, 4));
        if (prod) trackRecentlyViewedProduct(prod);
        if (prod?.variants?.[0]) {
          setSelectedVariant(prod.variants[0]);
        }
      })
      .finally(() => setIsLoading(false));
  }, [handle]);

  // Get unique sizes and colors
  const sizes = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((v) => v.size))];
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((v) => v.color))];
  }, [product]);

  // Related products (same category, different product)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return getRelatedProducts(product, allProducts, 4);
  }, [product, allProducts]);

  const handleSizeSelect = (size: string) => {
    if (!product) return;
    const color = selectedVariant?.color;
    const match =
      product.variants.find((v) => v.size === size && v.color === color) ||
      product.variants.find((v) => v.size === size);
    if (match) setSelectedVariant(match);
  };

  const handleColorSelect = (color: string) => {
    if (!product) return;
    const size = selectedVariant?.size;
    const match =
      product.variants.find((v) => v.color === color && v.size === size) ||
      product.variants.find((v) => v.color === color);
    if (match) setSelectedVariant(match);
  };

  const renderStars = (rating: number = 5) => {
    return (
      <div style={{ display: "flex", gap: "2px", color: "var(--accent)" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "★" : "☆"}</span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="cart-empty">
        <h1>Product not found</h1>
        <p>The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="btn">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/products" },
        { label: product.category, href: `/products?category=${product.category}` },
        { label: product.title }
      ]} />

      <section className="pdp">
        <div className="pdp-image" style={{ aspectRatio: "3/4" }}>
          {product.image || product.videoUrl ? (
            <Carousel 
              items={[
                ...(product.image ? [<div key="img" style={{ position: "relative", width: "100%", height: "100%" }}><Image src={product.image} alt={product.title} fill style={{ objectFit: "cover" }} priority sizes="(max-width: 768px) 100vw, 50vw" /></div>] : []),
                ...(product.videoUrl ? [<video key="vid" src={product.videoUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />] : []),
                <div key="2" className="card-image-placeholder" style={{ height: "100%" }}>✦ Alternate View 1</div>
              ]} 
            />
          ) : (
            <div className="card-image-placeholder" style={{ height: "100%" }}>✦</div>
          )}
        </div>
        <div className="pdp-info">
          <span className="pdp-category">{product.category}</span>
          <h1 className="pdp-title">{product.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
            {renderStars(product.rating || 5)}
            <span className="text-muted" style={{ fontSize: "0.9rem" }}>
              ({product.reviewsCount || Math.floor(Math.random() * 50) + 10} reviews)
            </span>
          </div>

          {selectedVariant && (
            <p className="pdp-price">{formatMoney(selectedVariant.priceInCents, "inr")}</p>
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
          {sizes.length > 0 && (
            <div className="pdp-variants">
              <h3>Size</h3>
              <div className="variant-options">
                {sizes.map((size) => (
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
          {colors.length > 0 && (
            <div className="pdp-variants">
              <h3>Color</h3>
              <div className="variant-options">
                {colors.map((color) => (
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
          {selectedVariant && selectedVariant.stock > 0 && (
            <div className="pdp-actions" style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant.id}
                title={product.title}
                image={product.image}
                size={selectedVariant.size}
                color={selectedVariant.color}
              />
              <button
                onClick={() => {
                  if (isSaved && product) removeFromWishlist(product.id);
                  else if (product) addToWishlist(product);
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
          )}

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
              <span>30-Day Returns</span>
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
              { question: "What is your return policy?", answer: "We offer a 30-day generous return policy. If you are not satisfied, you can return unworn items for a full refund." }
            ]}
          />
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section style={{ marginTop: "var(--space-4xl)", padding: "var(--space-2xl)", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
        <div className="section-header">
          <h2 className="section-title">Customer Reviews</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{product.rating || 4.8}</span>
            {renderStars(Math.round(product.rating || 5))}
          </div>
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
      {recentlyViewed.length > 0 && (
        <section style={{ marginTop: "var(--space-4xl)" }}>
          <div className="section-header">
            <h2 className="section-title">Recently Viewed</h2>
            <Link href="/products" className="section-link">View all →</Link>
          </div>
          <div className="grid">
            {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
