import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";
  const isStaging = /staging|preview|localhost/i.test(config.siteUrl);

  return {
    rules: {
      userAgent: "*",
      allow: isProduction && !isStaging ? "/" : undefined,
      disallow: !isProduction || isStaging ? "/" : ["/account", "/checkout", "/cart", "/admin"]
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: config.siteUrl
  };
}

