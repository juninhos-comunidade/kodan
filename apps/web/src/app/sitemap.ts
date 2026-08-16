import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/inicio", "/desafios", "/ajuda", "/privacidade"];
  return routes.map((route, index) => ({
    url: new URL(route || "/", siteUrl).toString(),
    lastModified: new Date("2026-08-16T00:00:00.000Z"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/desafios" ? 0.9 : 0.6,
  }));
}
