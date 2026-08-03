import type { Metadata } from "next";
import { config } from "./config";
import { formatMoney } from "./format";
import type { BreadcrumbItem } from "@/components/Breadcrumb";
import type { Product } from "./types";
import { getPrimaryPrice } from "./catalog";

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.siteUrl}${normalizedPath}`;
}

export function productMetadata(product: Product): Metadata {
  const title = product.metadata?.metaTitle || `${product.title} | ${config.storeName}`;
  const description = product.metadata?.metaDescription || product.description || `Shop ${product.title} from ${config.storeName}.`;
  const url = absoluteUrl(`/products/${product.handle}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: config.storeName,
      type: "website",
      images: product.image ? [{ url: product.image, alt: `${product.title} product image` }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined
    }
  };
}

export function categoryMetadata(category?: string): Metadata {
  const label = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Products";
  const title = `${label} | ${config.storeName}`;
  const description = `Shop ${label.toLowerCase()} from ${config.storeName}'s curated fashion catalog.`;
  const path = category ? `/products?category=${encodeURIComponent(category)}` : "/products";

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { title, description, url: absoluteUrl(path), siteName: config.storeName, type: "website" },
    twitter: { card: "summary", title, description }
  };
}

export function productJsonLd(product: Product): Record<string, unknown> {
  const price = getPrimaryPrice(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    sku: product.variants[0]?.sku,
    category: product.category,
    brand: { "@type": "Brand", name: config.storeName },
    aggregateRating: product.rating ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewsCount || 1
    } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.handle}`),
      priceCurrency: "INR",
      price: (price / 100).toFixed(2),
      availability: product.variants.some((variant) => variant.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : undefined
    }))
  };
}

export function productAltText(product: Product): string {
  const price = getPrimaryPrice(product);
  return `${product.title} in ${product.category}${price ? `, priced at ${formatMoney(price, "inr")}` : ""}`;
}

