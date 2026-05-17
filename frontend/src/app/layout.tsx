import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Irraya Fashion",
  description: "Fashion commerce storefront"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container page">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

