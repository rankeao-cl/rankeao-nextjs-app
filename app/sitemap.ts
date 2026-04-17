import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api/client";

const BASE_URL = "https://rankeao.cl";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function fetchTournamentUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await apiFetch<unknown>("/tournaments", { per_page: 100 }, { revalidate: 3600 });
    const root = asRecord(data);
    const nested = asRecord(root?.data);
    const tournaments = asArray<{ id: string }>(nested?.tournaments ?? root?.tournaments ?? root?.data);
    return tournaments.map((t) => ({
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
    const data = await apiFetch<unknown>("/tenants", { per_page: 100 }, { revalidate: 3600 });
    const root = asRecord(data);
    const nested = asRecord(root?.data);
    const communities = asArray<{ slug: string }>(nested?.tenants ?? root?.tenants ?? root?.data);
    return communities.map((c) => ({
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
