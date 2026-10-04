import Link from "next/link";
import { IconHeart, IconStar, IconDiamond } from "@/components/Icons";

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
          <div className="value-icon"><IconStar size={24} /></div>
          <h3>Quality First</h3>
          <p>
            We source premium materials from trusted suppliers around the world.
            Each garment goes through rigorous quality checks before it reaches you.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon"><IconHeart size={24} /></div>
          <h3>Ethical Production</h3>
          <p>
            Our manufacturing partners provide fair wages and safe working conditions.
            We believe fashion should empower everyone in the supply chain.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon"><IconDiamond size={24} /></div>
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
        <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p>
            <strong>IRRAYA</strong> began in <strong>2026</strong>, from a simple love for art and the beauty of things made by hand.
          </p>
          <p>
            For me, art has always been more than just something to create. It is a way of expressing emotions, finding beauty in little details, and turning a simple idea into something meaningful. My love for <em>hand-painted art, handcrafted details, textures, colours, and traditional techniques</em> slowly made me wonder — <strong>why can&apos;t this feeling of art be part of what we wear every day?</strong>
          </p>
          <p>
            That thought became <strong>IRRAYA</strong>.
          </p>
          <p>
            IRRAYA was created with the idea of bringing the beauty of art into everyday clothing. We explore <em>hand-painted elements, hand block printing, embroidery, textures</em> and other handcrafted details, combining them with comfortable, contemporary silhouettes.
          </p>
          <p>
            We believe everyday clothing doesn&apos;t have to be ordinary or boring. It can carry a little piece of art, a story, a texture, or a detail that makes you feel <strong>special</strong>.
          </p>
          <p>
            Our journey began with womenswear and continues to grow towards creating thoughtful everyday pieces for both women and men — pieces that are comfortable enough for everyday life, yet expressive enough to feel like something more than just clothing.
          </p>
          <p>
            We don&apos;t want everything to look perfectly identical. The <strong>charm of handmade work</strong> lies in the little variations that make each piece feel personal.
          </p>
          <p>
            <strong>IRRAYA</strong> is where my love for art meets my love for clothing — creating everyday wear with a touch of the <em>handmade, the thoughtful, and the artistic</em>.
          </p>
          <p>
            Started in <strong>2026</strong>, IRRAYA is only the beginning of that journey.
          </p>
        </div>
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
