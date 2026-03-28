/**
 * Shared formatting utilities.
 */

interface TimeAgoOptions {
    /** Prefix "hace" before the value (e.g. "hace 5m"). Default: false → "5m". */
    verbose?: boolean;
    /** After this many days, fall back to a locale date string (es-CL). */
    fallbackDays?: number;
}

/** Returns a Spanish relative-time string. */
export function timeAgo(dateStr?: string | null, opts?: TimeAgoOptions): string {
    if (!dateStr) return "";
    const { verbose = false, fallbackDays } = opts ?? {};

    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return verbose ? "hace instantes" : "ahora";
    if (mins < 60) return verbose ? `hace ${mins}m` : `${mins}m`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return verbose ? `hace ${hours}h` : `${hours}h`;

    const days = Math.floor(hours / 24);

    if (fallbackDays && days >= fallbackDays) {
        return new Date(dateStr).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    if (days < 7) return verbose ? `hace ${days}d` : `${days}d`;

    const weeks = Math.floor(days / 7);
    if (days < 30) return verbose ? `hace ${weeks}sem` : `${weeks}sem`;

    const months = Math.floor(days / 30);
    return verbose ? `hace ${months} mes${months > 1 ? "es" : ""}` : `${months}mes`;
}

/** Strip HTML tags from a string. */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
}

/** Convert a card name (or any string) to a URL slug: lowercase, non-alphanumeric → hyphen. */
export function toCardSlug(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
