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

/** Sanitize a backend-supplied URL: only allow relative paths and same-origin HTTPS URLs. */
export function sanitizeHref(url: string | undefined | null): string | null {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    try {
        const parsed = new URL(url);
        if (parsed.origin === "https://rankeao.cl" || parsed.origin === "https://www.rankeao.cl") return url;
    } catch { /* invalid URL */ }
    return null;
}

// ── Currency / wallet helpers ──

/**
 * Formats a monetary value into an es-CL currency string.
 * Accepts either string (backend NUMERIC, preferred) or number.
 * CLP renders without decimals; every other currency uses 2 decimals.
 */
export function formatCurrency(amount: string | number, currency = "CLP"): string {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency,
        minimumFractionDigits: currency === "CLP" ? 0 : 2,
        maximumFractionDigits: currency === "CLP" ? 0 : 2,
    }).format(safe);
}

/**
 * Same as formatCurrency, but preserves the sign explicitly as "+…" or "−…".
 * Useful for transaction rows where direction matters visually.
 */
export function formatSignedCurrency(amount: string | number, currency = "CLP"): string {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    const safe = Number.isFinite(n) ? n : 0;
    const abs = Math.abs(safe);
    const formatted = formatCurrency(abs, currency);
    if (safe > 0) return `+${formatted}`;
    if (safe < 0) return `−${formatted}`;
    return formatted;
}

/** Compact relative time (Spanish). Short form for dense UIs (sidebars/tables). */
export function formatRelativeTime(iso: string): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "ahora";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString("es-CL");
}

/** True when a wallet transaction kind represents a credit (money in). */
export function isCreditTx(kind: string): boolean {
    return [
        "DEPOSIT",
        "SALE_PROCEEDS",
        "AUCTION_RELEASE",
        "RAFFLE_PRIZE",
        "REFERRAL_REWARD",
        "TIP",
        "REFUND",
    ].includes(kind);
}
