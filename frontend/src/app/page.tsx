import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getProducts } from "@/lib/api/products";
import { ScrollableProductRow } from "@/components/ScrollableProductRow";
import { ScrollableCollectionRow } from "@/components/ScrollableCollectionRow";
import {
  IconHeart,
  IconStar,
  IconRefreshCw,
  IconTruck,
  IconInstagram,
  IconArrowRight,
} from "@/components/Icons";

const socialLooks = [
  { id: 1, image: "/images/social/look-1.jpg", alt: "Irraya slow fashion look 1" },
  { id: 2, image: "/images/social/look-2.jpg", alt: "Irraya slow fashion look 2" },
  { id: 3, image: "/images/social/look-3.jpg", alt: "Irraya slow fashion look 3" },
  { id: 4, image: "/images/social/look-4.jpg", alt: "Irraya slow fashion look 4" },
  { id: 5, image: "/images/social/look-5.jpg", alt: "Irraya slow fashion look 5" },
  { id: 6, image: "/images/social/look-6.jpg", alt: "Irraya slow fashion look 6" },
];

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

  // New arrivals: tagged with new/latest or fallback to catalog head
  const taggedNewArrivals = products.filter((p) =>
    p.tags?.some((t) => ["new", "new-arrival", "new-arrivals", "latest"].includes(t.toLowerCase()))
  );
  const newArrivals = taggedNewArrivals.length >= 3 ? taggedNewArrivals : products.slice(0, 8);

  // Trending products: top 10 items for 5-column browsable grid
  const trendingProducts = [...products]
    .sort(
      (a, b) =>
        (b.variants[0]?.priceInCents ?? 0) - (a.variants[0]?.priceInCents ?? 0)
    )
    .slice(0, 10);

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          position: "relative",
          overflow: "hidden",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <Image
          src="/images/banner.jpg"
          alt="Irraya Fashion Banner"
          fill
          style={{ objectFit: "cover", objectPosition: "center 25%", zIndex: 0 }}
          priority
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 0 }} />

        {/* Tag pinned to top of banner */}
        <span
          className="hero-tag"
          style={{
            position: "relative",
            zIndex: 1,
            color: "white",
            borderColor: "rgba(255,255,255,0.4)",
            alignSelf: "center",
            marginTop: "var(--space-xl)",
          }}
        >
          New Collection 2026
        </span>

        {/* Spacer — photo visible here */}
        <div style={{ flex: 1 }} />

        {/* H1 + button at bottom */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            Slow fashion for everyday style
          </h1>
          <Link
            href="/products"
            className="btn btn-lg"
            style={{ background: "white", color: "black", border: "none" }}
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Features / Trust Signals Row */}
      <div className="features-row">
        <div className="feature-item">
          <div className="feature-icon"><IconTruck size={20} /></div>
          <h4>Complimentary Shipping</h4>
          <p>Free express delivery across India on all orders</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconStar size={20} /></div>
          <h4>Artisanal Quality</h4>
          <p>Meticulously tailored from premium, durable fabrics</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconRefreshCw size={20} /></div>
          <h4>48-Hour Exchanges</h4>
          <p>Hassle-free doorstep size exchanges. No returns.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon"><IconHeart size={20} /></div>
          <h4>Slow Fashion</h4>
          <p>Consciously produced in limited, mindful batches</p>
        </div>
      </div>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section id="new-arrivals" style={{ marginTop: "var(--space-3xl)" }}>
          <div className="section-header">
            <div>
              <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>Fresh Drops</span>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link href="/products?sort=newest" className="section-link">
              View all →
            </Link>
          </div>
          <ScrollableProductRow products={newArrivals} />
        </section>
      )}

      {/* Collections (Portrait 3:4 Cards) */}
      <section id="collections" style={{ marginTop: "var(--space-3xl)" }}>
        <div className="section-header">
          <div>
            <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>Curated Capsules</span>
            <h2 className="section-title">Shop by Collection</h2>
          </div>
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

      {/* Editorial Story Section — Full Width Brand Ethos */}
      <section className="editorial-story-banner">
        <div className="editorial-story-copy">
          <span className="editorial-story-eyebrow">The Irraya Ethos</span>
          <h2 className="editorial-story-title">
            Designed with intention, crafted for everyday rituals.
          </h2>
          <p className="editorial-story-text">
            We reject the fleeting churn of seasonal fast fashion. Each Irraya silhouette is
            thoughtfully tailored from breathable, premium textiles — celebrating understated elegance,
            conscious craftsmanship, and enduring comfort that outlasts trends.
          </p>
          <div className="editorial-story-actions">
            <Link href="/about" className="btn">
              Discover Our Story
            </Link>
            <Link href="/products" className="btn btn-outline">
              Shop The Wardrobe
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Collection — 5-Column Browsable Grid on Desktop */}
      <section style={{ marginTop: "var(--space-3xl)" }}>
        <div className="section-header">
          <div>
            <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>Popular Now</span>
            <h2 className="section-title">Trending Styles</h2>
          </div>
          <Link href="/products" className="section-link">View all ({products.length}) →</Link>
        </div>
        {trendingProducts.length > 0 ? (
          <>
            <div className="grid">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "var(--space-2xl)" }}>
              <Link href="/products" className="btn btn-outline" style={{ minWidth: 220 }}>
                Explore All Products <IconArrowRight size={16} style={{ marginLeft: 6, display: "inline-block", verticalAlign: "middle" }} />
              </Link>
            </div>
          </>
        ) : (
          <div className="cart-empty" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
            <h2>No trending products yet</h2>
            <p>New arrivals will appear here shortly.</p>
          </div>
        )}
      </section>

      {/* Social Proof Strip */}
      <section className="social-proof-section">
        <div className="section-header">
          <div>
            <span className="hero-tag" style={{ marginBottom: "var(--space-xs)" }}>@irraya.co</span>
            <h2 className="section-title">Styled by You</h2>
          </div>
          <a
            href="https://www.instagram.com/irraya.co"
            target="_blank"
            rel="noopener noreferrer"
            className="section-link"
          >
            Follow on Instagram →
          </a>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "-8px", marginBottom: "var(--space-md)" }}>
          Community looks &amp; everyday silhouettes. Tag <strong style={{ color: "var(--text-primary)" }}>#IrrayaStyle</strong> to be featured.
        </p>
        <div className="social-proof-grid">
          {socialLooks.map((look) => (
            <a
              key={look.id}
              href="https://www.instagram.com/irraya.co"
              target="_blank"
              rel="noopener noreferrer"
              className="social-proof-item"
              aria-label="View @irraya.co on Instagram"
            >
              <Image
                src={look.image}
                alt={look.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                style={{ objectFit: "cover" }}
              />
              <div className="social-proof-overlay">
                <IconInstagram size={22} />
                <span>@irraya.co</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Re-enabled Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <span
            className="hero-tag"
            style={{
              borderColor: "rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.85)",
              marginBottom: "var(--space-md)",
            }}
          >
            The Irraya Circle
          </span>
          <h2 className="section-title" style={{ color: "#FFF", marginBottom: "var(--space-sm)" }}>
            Enjoy 10% Off Your First Order
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              marginBottom: "var(--space-xl)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
            }}
          >
            Join our private circle for early access to limited capsule releases, mindful styling notes, and an exclusive welcome gift.
          </p>
          <NewsletterForm />
          <span
            style={{
              display: "block",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.45)",
              marginTop: "var(--space-md)",
              letterSpacing: "0.02em",
            }}
          >
            Zero spam. Unsubscribe at any time with a single click.
          </span>
        </div>
      </section>
    </>
  );
}

