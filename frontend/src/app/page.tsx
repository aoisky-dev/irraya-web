import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getProducts } from "@/lib/api/products";

export default async function HomePage() {
  const products = await getProducts();

  // Get unique categories for collection cards
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <span className="hero-tag">New Collection 2026</span>
        <h1>Modern fashion for everyday style</h1>
        <p>
          Discover premium essentials crafted with quality materials and designed
          for the conscious individual.
        </p>
        <Link href="/products" className="btn btn-lg">
          Explore Collection
        </Link>
      </section>

      {/* Features Row */}
      <div className="features-row">
        <div className="feature-item">
          <div className="feature-icon">✦</div>
          <h4>Premium Quality</h4>
          <p>Crafted from the finest materials</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">◇</div>
          <h4>Free Shipping</h4>
          <p>On orders over ₹5,000</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">↻</div>
          <h4>Easy Returns</h4>
          <p>30-day return policy</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">♡</div>
          <h4>Sustainable</h4>
          <p>Ethically sourced fabrics</p>
        </div>
      </div>

      {/* Collections */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <Link href="/products" className="section-link">View all →</Link>
        </div>
        <div className="collections-grid">
          {categories.slice(0, 4).map((cat) => {
            const catProduct = products.find((p) => p.category === cat);
            return (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                className="collection-card"
              >
                {catProduct?.image && (
                  <img src={catProduct.image} alt={cat} loading="lazy" />
                )}
                <div className="collection-card-overlay">
                  <span className="collection-card-title">{cat}</span>
                  <span className="collection-card-count">
                    {products.filter((p) => p.category === cat).length} items
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ marginTop: "var(--space-3xl)" }}>
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <Link href="/products" className="section-link">View all →</Link>
        </div>
        <div className="grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
