import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { CompareProvider } from "@/components/CompareProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
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
  },
  alternates: {
    canonical: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: "Irraya Fashion — Modern Style, Timeless Craft",
    description: "Discover premium fashion essentials crafted with quality materials and timeless design."
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="scroll-progress" aria-hidden="true" />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <Header />
                  <main className="container page">{children}</main>
                  <Footer />
                  <FeedbackWidget />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
