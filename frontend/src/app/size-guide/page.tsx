import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconMail, IconWhatsApp } from "@/components/Icons";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Size Guide & Measurements | Irraya Fashion",
  description: "View sizing charts and body measurement guides for Irraya women's tops and bottoms.",
};

export default function SizeGuidePage() {
  return (
    <section style={{ maxWidth: "960px", margin: "0 auto", padding: "var(--space-xl) 0" }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "var(--space-lg)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/" style={{ color: "var(--text-muted)" }}>Home</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Size Guide</span>
      </nav>

      <div style={{ marginBottom: "var(--space-2xl)" }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "var(--space-sm)", letterSpacing: "-0.02em" }}>
          Size Guide &amp; Measurement Chart
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "60ch", lineHeight: 1.6 }}>
          Find your perfect fit across all Irraya collections. Refer to the size chart and measurement guide below.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          alignItems: "start"
        }}
      >
        {/* Size Chart Image */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #eaeaea)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>
            Size Chart
          </h2>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "678 / 1241",
              background: "#ffffff",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <Image
              src="/images/size-guide/size-chart.jpg"
              alt="Irraya Women's Size Chart"
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 768px) 100vw, 460px"
              priority
            />
          </div>
        </div>

        {/* Size Measurement Image */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #eaeaea)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>
            How to Measure
          </h2>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "960 / 1600",
              background: "#ffffff",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <Image
              src="/images/size-guide/size-measurement.jpg"
              alt="Irraya Size Measurement Guide"
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 768px) 100vw, 460px"
              priority
            />
          </div>
        </div>
      </div>

      {/* Custom Tailoring Assistance */}
      <div
        style={{
          marginTop: "var(--space-3xl)",
          padding: "var(--space-xl)",
          background: "var(--bg-secondary, #f8f9fa)",
          borderRadius: "12px",
          border: "1px solid var(--border, #eaeaea)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-lg)"
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 600 }}>Need Custom Sizing or Tailoring?</h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: "48ch" }}>
            We craft made-to-measure pieces upon request. Send us your custom specifications and our team will assist you.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <a
            href={`mailto:${config.contactEmail}?subject=${encodeURIComponent("Custom Sizing Request")}`}
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 16px" }}
          >
            <IconMail size={16} /> Email Us
          </a>
          <a
            href={`https://wa.me/${config.whatsAppNumber}?text=${encodeURIComponent("Hello! I would like to inquire about custom sizing for an order.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 16px" }}
          >
            <IconWhatsApp size={16} /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
