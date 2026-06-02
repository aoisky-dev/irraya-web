import Link from "next/link";

export function Footer() {
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
            <Link href="/products">T-Shirts</Link>
            <Link href="/products">Dresses</Link>
            <Link href="/products">Hoodies</Link>
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
