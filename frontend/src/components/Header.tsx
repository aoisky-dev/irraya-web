import Link from "next/link";
import { config } from "@/lib/config";

export function Header(): JSX.Element {
  return (
    <header className="header">
      <div className="container nav-row">
        <Link href="/" className="brand">
          {config.storeName}
        </Link>
        <nav className="nav-links">
          <Link href="/about">About</Link>
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/account">Account</Link>
        </nav>
      </div>
    </header>
  );
}

