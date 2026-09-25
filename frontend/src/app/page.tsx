import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getProducts } from "@/lib/api/products";
import { ScrollableProductRow } from "@/components/ScrollableProductRow";
import { ScrollableCollectionRow } from "@/components/ScrollableCollectionRow";
import { IconHeart, IconStar, IconDiamond, IconRefreshCw } from "@/components/Icons";

export default async function HomePage() {
  let products = [] as Awaited<ReturnType<typeof getProducts>>;
  let catalogLoadFailed = false;

  try {
    products = await getProducts();
  } catch (error) {
    catalogLoadFailed = true;
    console.error("Failed to load homepage catalog from Medusa", error);
  }

  // Collections: unique categories with image + count
  const categories = [...new Set(products.map((p) => p.category))].filter(Boolean);
  const collections = categories.map((cat) => ({
    category: cat,
    image: products.find((p) => p.category === cat)?.image,
    count: products.filter((p) => p.category === cat).length,
  }));

  const featuredProducts = products.filter((p) => p.tags?.includes("featured"));
  const trendingProducts = [...products]
    .sort(
      (a, b) =>
        (b.variants[0]?.priceInCents ?? 0) - (a.variants[0]?.priceInCents ?? 0)
    )
    .slice(0, 10);

  return (
    <>
      {/* Hero Section */}
      <section className="hero" style={{ position: "relative", overflow: "hidden", color: "white", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <Image
          src="/images/banner.jpg"
          alt="Irraya Fashion Banner"
          fill
          style={{ objectFit: "cover", objectPosition: "center 25%", zIndex: 0 }}
          priority
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 0 }} />

        {/* Tag pinned to top of banner */}
        <span className="hero-tag" style={{ position: "relative", zIndex: 1, color: "white", borderColor: "rgba(255,255,255,0.4)", alignSelf: "center", marginTop: "var(--space-xl)" }}>New Collection 2026</span>

        {/* Spacer — photo visible here */}
        <div style={{ flex: 1 }} />

        {/* H1 + button at bottom */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h1 style={{ color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>Slow fashion for everyday style</h1>
          <Link href="/products" className="btn btn-lg" style={{ background: "white", color: "black", border: "none" }}>
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Features Row */}
      <div className="features-row">
        <div className="feature-item">
          <div className="feature-icon"><IconStar size={24} /></div>
          <h4>Premium Quality</h4>
          <p>Crafted from the finest materials</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconDiamond size={24} /></div>
          <h4>Free Shipping</h4>
          <p>On all orders</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconRefreshCw size={24} /></div>
          <h4>Easy Exchanges</h4>
          <p>48-hour exchange only. No returns.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconHeart size={24} /></div>
          <h4>Sustainable</h4>
          <p>Ethically sourced fabrics</p>
        </div>
      </div>

      {/* Collections */}
      <section id="collections">
        <div className="section-header">
          <h2 className="section-title">Shop by Collection</h2>
          <Link href="/collections" className="section-link">View all →</Link>
        </div>
        {catalogLoadFailed && (
          <div className="card" style={{ marginBottom: "var(--space-lg)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              We could not load the catalog from backend right now. Please verify Medusa publishable key configuration and try again.
            </p>
          </div>
        )}
        <ScrollableCollectionRow collections={collections} />
      </section>

      {/* Featured Products */}
      <section style={{ marginTop: "var(--space-xl)" }}>
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <Link href="/products" className="section-link">View all →</Link>
        </div>
        {featuredProducts.length > 0 ? (
          <ScrollableProductRow products={featuredProducts} />
        ) : (
          <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
            <h2>No featured products found</h2>
            <p>Add the "featured" tag to products in Medusa to show them here.</p>
          </div>
        )}
      </section>

      {/* Trending Collection */}
      <section style={{ marginTop: "var(--space-xl)" }}>
        <div className="section-header">
          <h2 className="section-title">Trending Collection</h2>
          <Link href="/products" className="section-link">View all →</Link>
        </div>
        {trendingProducts.length > 0 ? (
          <ScrollableProductRow products={trendingProducts} />
        ) : (
          <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
            <h2>No trending products yet</h2>
            <p>New arrivals will appear here shortly.</p>
          </div>
        )}
      </section>

      {/* Brand Story Preview */}
      <section className="brand-story-section">
        <div className="brand-story-content">
          <span className="hero-tag" style={{ marginBottom: "var(--space-lg)" }}>Our Philosophy</span>
          <h2 className="section-title" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", marginBottom: "var(--space-lg)" }}>
            Fashion with Intention
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.85, fontSize: "1rem", maxWidth: 560, margin: "0 auto var(--space-xl)" }}>
            Every piece in our collection is designed to last — both in style and
            durability. We work with artisans who share our commitment to quality
            and ethical production.
          </p>
          <Link href="/about" className="btn btn-outline">
            Read Our Story
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2 className="section-title" style={{ marginBottom: "var(--space-sm)" }}>Stay in the Loop</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)" }}>
            Get early access to new collections, exclusive offers, and style inspiration.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
