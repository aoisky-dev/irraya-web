import Link from "next/link";
import { getProducts } from "@/lib/api/products";

const formatCategoryLabel = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export async function Footer() {
  let categories: string[] = [];

  try {
    const products = await getProducts();
    categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  } catch {
    categories = [];
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Irraya</div>
            <p className="footer-desc">
              Modern fashion for the conscious individual. Quality craftsmanship meets timeless design.
            </p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <Link href="/products">All Products</Link>
            {categories.slice(0, 3).map((category) => (
              <Link key={category} href={`/products?category=${encodeURIComponent(category)}`}>
                {formatCategoryLabel(category)}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/about">Sustainability</Link>
            <Link href="/about">Careers</Link>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <Link href="/account">My Account</Link>
            <Link href="/cart">Shopping Cart</Link>
            <Link href="/about">Contact Us</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Irraya Fashion. All rights reserved.</span>
          <span>Crafted with care in India</span>
        </div>
      </div>
    </footer>
  );
}
