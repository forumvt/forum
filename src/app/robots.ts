import type { MetadataRoute } from "next";

import { absoluteUrl, CANONICAL_SITE_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/moderacao",
        "/mensagens",
        "/settings",
        "/ignorados",
        "/subs",
        "/forgot-password",
        "/reset-password",
        "/*/post-thread",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: CANONICAL_SITE_ORIGIN,
  };
}
