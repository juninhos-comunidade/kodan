import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/cadastro",
        "/perfil",
        "/configuracoes",
        "/recuperar-senha",
        "/redefinir-senha",
        "/verificar-email",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
