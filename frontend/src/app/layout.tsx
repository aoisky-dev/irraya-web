import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { CompareProvider } from "@/components/CompareProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Irraya Fashion — Modern Style, Timeless Craft",
  description:
    "Discover premium fashion essentials crafted with quality materials and timeless design. Shop hoodies, t-shirts, dresses, and more.",
  keywords: ["fashion", "clothing", "premium", "sustainable", "Irraya"],
  openGraph: {
    title: "Irraya Fashion — Modern Style, Timeless Craft",
    description:
      "Discover premium fashion essentials crafted with quality materials and timeless design.",
    siteName: "Irraya Fashion",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <Header />
                  <main className="container page">{children}</main>
                  <Footer />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
