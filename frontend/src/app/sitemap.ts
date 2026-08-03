import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api/products";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await getProducts({ limit: 200 }).catch(() => []);
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  return [
    "",
    "/products",
    "/categories",
    "/search",
    "/about",
    "/returns",
    "/privacy"
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  } as MetadataRoute.Sitemap[number]))
    .concat(categories.map((category) => ({
      url: absoluteUrl(`/products?category=${encodeURIComponent(category)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6
    } as MetadataRoute.Sitemap[number])))
    .concat(products.map((product) => ({
      url: absoluteUrl(`/products/${product.handle}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    } as MetadataRoute.Sitemap[number])));
}

