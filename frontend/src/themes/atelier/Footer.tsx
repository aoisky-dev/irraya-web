import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { config } from "@/lib/config";
import { IconMail, IconPhone, IconWhatsApp } from "@/components/Icons";

const fmt = (v: string) =>
  v.split("-").filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

export async function Footer() {
  let categories: string[] = [];
  try {
    const products = await getProducts();
    categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  } catch {
    categories = [];
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-row">
          <span className="footer-brand-display">Irraya</span>
          <p className="footer-brand-line">Slow fashion for everyday style.</p>
        </div>

        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>Shop</h4>
              <Link href="/products">All Products</Link>
              {categories.slice(0, 4).map(cat => (
                <Link key={cat} href={`/products?category=${encodeURIComponent(cat)}`}>{fmt(cat)}</Link>
              ))}
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/about">Sustainability</Link>
              <Link href="/about">Careers</Link>
              <Link href="/about">Press</Link>
            </div>
            <div className="footer-col">
              <h4>Help</h4>
              <Link href="/account">My Account</Link>
              <Link href="/cart">Shopping Bag</Link>
              <Link href="/returns">Exchange Policy</Link>
            </div>
            <div className="footer-col" style={{ gap: "12px" }}>
              <h4>Contact & Follow</h4>
              <a
                href={`mailto:${config.contactEmail}`}
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content", padding: "6px 12px", fontSize: "0.8rem" }}
              >
                <IconMail size={16} /> Email Us
              </a>
              <a
                href={`tel:${config.contactPhone.replace(/\s+/g, "")}`}
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content", padding: "6px 12px", fontSize: "0.8rem" }}
              >
                <IconPhone size={16} /> {config.contactPhone}
              </a>
              <a
                href={`https://wa.me/${config.whatsAppNumber}?text=${encodeURIComponent(`Hi IRRAYA, I need some assistance.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content", padding: "6px 12px", fontSize: "0.8rem" }}
              >
                <IconWhatsApp size={16} /> WhatsApp
              </a>
              <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                <Link href="https://www.instagram.com/irraya.co" target="_blank" rel="noopener noreferrer">Instagram</Link>
                <Link href="/">Pinterest</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Irraya Fashion. All rights reserved.</span>
            <div className="footer-legal">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/returns">Shipping & Exchanges</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
