import Link from "next/link";

export default function AboutPage() {
  return (
    <section>
      <div className="about-hero">
        <h1>Fashion with Purpose</h1>
        <p>
          At Irraya, we believe that great style shouldn&apos;t come at the cost
          of quality or conscience. Every piece in our collection is thoughtfully
          designed and ethically crafted.
        </p>
      </div>

      <div className="values-grid">
        <div className="value-card">
          <div className="value-icon">✦</div>
          <h3>Quality First</h3>
          <p>
            We source premium materials from trusted suppliers around the world.
            Each garment goes through rigorous quality checks before it reaches you.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon">♡</div>
          <h3>Ethical Production</h3>
          <p>
            Our manufacturing partners provide fair wages and safe working conditions.
            We believe fashion should empower everyone in the supply chain.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon">◇</div>
          <h3>Sustainable Design</h3>
          <p>
            We design for longevity, not trends. Our timeless pieces are made to
            last, reducing waste and encouraging mindful consumption.
          </p>
        </div>
      </div>

      <hr className="divider" style={{ margin: "var(--space-xl) 0" }} />

      <div className="about-hero">
        <h2 className="section-title" style={{ marginBottom: "var(--space-lg)" }}>Our Story</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem" }}>
          Founded in 2024, Irraya started with a simple idea: create fashion
          essentials that you can feel good about wearing. From our first
          collection of premium basics to the expanding range you see today,
          we&apos;ve stayed true to our commitment to quality craftsmanship,
          sustainable materials, and timeless design.
        </p>
        <div style={{ marginTop: "var(--space-xl)" }}>
          <Link href="/products" className="btn">
            Explore Our Collection
          </Link>
        </div>
      </div>
      
      <hr className="divider" style={{ margin: "var(--space-xl) 0" }} />

      <div className="about-hero" style={{ paddingTop: 0 }}>
        <h2 className="section-title" style={{ marginBottom: "var(--space-md)" }}>Contact Us</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
          Have a question or need assistance? We're here to help.
          <br /><br />
          <strong>Email:</strong> <a href="mailto:info@irraya.com" style={{ textDecoration: "underline" }}>info@irraya.com</a><br />
          <strong>Phone:</strong> <a href="tel:8500365656" style={{ textDecoration: "underline" }}>8500365656</a>
        </p>
      </div>
    </section>
  );
}
