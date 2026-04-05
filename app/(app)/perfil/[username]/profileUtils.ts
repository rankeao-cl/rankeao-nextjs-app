/** Shared utilities for the profile page and its sub-components. */

export type ProfileTab =
    | "actividad"
    | "mazos"
    | "coleccion"
    | "torneos"
    | "stats"
    | "marketplace"
    | "logros";

export const TABS: { key: ProfileTab; label: string }[] = [
    { key: "actividad", label: "Actividad" },
    { key: "torneos", label: "Torneos" },
    { key: "mazos", label: "Mazos" },
    { key: "coleccion", label: "Coleccion" },
    { key: "stats", label: "Stats" },
    { key: "logros", label: "Logros" },
    { key: "marketplace", label: "Market" },
];

export function toArray<T>(value: unknown): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.data)) return v.data;
    if (v.data && typeof v.data === "object") {
        const inner = v.data as Record<string, unknown>;
        if (Array.isArray(inner.activity)) return inner.activity;
        if (Array.isArray(inner.items)) return inner.items;
        if (Array.isArray(inner.collection)) return inner.collection;
        if (Array.isArray(inner.feed)) return inner.feed;
        if (Array.isArray(inner.decks)) return inner.decks;
        if (Array.isArray(inner.listings)) return inner.listings;
        if (Array.isArray(inner.badges)) return inner.badges;
        if (Array.isArray(inner.friends)) return inner.friends;
        if (Array.isArray(inner.followers)) return inner.followers;
        if (Array.isArray(inner.following)) return inner.following;
        if (Array.isArray(inner.wishlist)) return inner.wishlist;
        if (Array.isArray(inner.history)) return inner.history;
        if (Array.isArray(inner.rating_history)) return inner.rating_history;
        if (Array.isArray(inner.tournaments)) return inner.tournaments;
    }
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.users)) return v.users;
    if (Array.isArray(v.activity)) return v.activity;
    if (Array.isArray(v.decks)) return v.decks;
    if (Array.isArray(v.listings)) return v.listings;
    if (Array.isArray(v.badges)) return v.badges;
    if (Array.isArray(v.history)) return v.history;
    if (Array.isArray(v.friends)) return v.friends;
    if (Array.isArray(v.followers)) return v.followers;
    if (Array.isArray(v.following)) return v.following;
    if (Array.isArray(v.wishlist)) return v.wishlist;
    if (Array.isArray(v.tournaments)) return v.tournaments;
    return [];
}

export function getRankGradient(level: number): string {
    if (level >= 10) return "linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #92400e 100%)";
    if (level >= 5) return "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #1e1b4b 100%)";
    return "linear-gradient(135deg, #0f172a 0%, #3b82f6 50%, #0f172a 100%)";
}

export function getRankRingColor(level: number): string {
    if (level >= 10) return "#f59e0b";
    if (level >= 5) return "#7c3aed";
    return "#3b82f6";
}
