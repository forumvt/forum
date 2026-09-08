import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/** Evita pré-render no build sem Postgres. Falha de DB devolve só URLs estáticas. */
export const dynamic = "force-dynamic";

const STATIC_PATHS: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/forums", changeFrequency: "daily", priority: 0.9 },
  { path: "/search", changeFrequency: "weekly", priority: 0.4 },
  { path: "/register", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  try {
    const [{ listForums }, { listPublicSitemapThreads }] = await Promise.all([
      import("@/services/forum.service"),
      import("@/services/thread.service"),
    ]);
    const [forums, threads] = await Promise.all([
      listForums(),
      listPublicSitemapThreads(),
    ]);

    for (const forum of forums) {
      entries.push({
        url: absoluteUrl(`/forums/${forum.slug}`),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const thread of threads) {
      entries.push({
        url: absoluteUrl(`/threads/${thread.slug}`),
        lastModified: thread.lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Continua com URLs públicas estáticas se o banco estiver indisponível.
  }

  return entries;
}
