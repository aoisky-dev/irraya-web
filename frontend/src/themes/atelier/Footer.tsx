import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { config } from "@/lib/config";

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
              <Link href="/about">Contact</Link>
            </div>
            <div className="footer-col">
              <h4>Follow</h4>
              <Link href="https://www.instagram.com/irraya.co" target="_blank" rel="noopener noreferrer">Instagram</Link>
              <Link href="/">Pinterest</Link>
              <Link href={`https://wa.me/${config.whatsAppNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp</Link>
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
