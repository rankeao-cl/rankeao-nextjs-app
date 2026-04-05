import type { MetadataRoute } from "next";

const BASE_URL = "https://rankeao.cl";
const API = "https://api.rankeao.cl/api/v1";

async function fetchTournamentUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/tournaments?per_page=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const tournaments =
      data?.data?.tournaments ?? data?.tournaments ?? data?.data ?? [];
    return (tournaments as { id: string }[]).map((t) => ({
      url: `${BASE_URL}/torneos/${t.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function fetchCommunityUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/tenants?per_page=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const communities =
      data?.data?.tenants ?? data?.tenants ?? data?.data ?? [];
    return (communities as { slug: string }[]).map((c) => ({
      url: `${BASE_URL}/comunidades/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/torneos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/comunidades`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const [tournamentUrls, communityUrls] = await Promise.all([
    fetchTournamentUrls(),
    fetchCommunityUrls(),
  ]);

  return [...staticRoutes, ...tournamentUrls, ...communityUrls];
}
