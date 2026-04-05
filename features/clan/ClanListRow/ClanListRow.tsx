"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClan } from "@/lib/api/clans";
import { Persons } from "@gravity-ui/icons";
import type { Clan } from "@/lib/types/clan";

export default function ClanListRow({ clan }: { clan: Clan }) {
    const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
    const [logoUrl, setLogoUrl] = useState(clan.logo_url || "");

    useEffect(() => {
        if (bannerUrl && logoUrl) return;
        getClan(clan.id)
            .then((res) => {
                const detail = res?.data?.clan ?? res?.clan;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    const clanRating = clan.clan_rating ?? clan.rating;
    const hasRating = clanRating != null && clanRating > 0;
    const memberCount = clan.member_count ?? 0;

    return (
        <Link href={`/clanes/${clan.slug || clan.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "var(--surface-solid)", borderRadius: 16,
                border: "1px solid var(--surface)",
                overflow: "hidden", display: "flex", position: "relative",
            }}>
                {/* Banner background — stretches full width behind content */}
                {(bannerUrl || logoUrl) && (
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        <img
                            src={bannerUrl || logoUrl}
                            alt=""
                            style={{
                                width: "100%", height: "100%", objectFit: "cover",
                                ...(bannerUrl ? {} : { transform: "scale(3)", filter: "blur(24px)", opacity: 0.15 }),
                            }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, color-mix(in srgb, var(--surface-solid) 92%, transparent), color-mix(in srgb, var(--surface-solid) 75%, transparent))" }} />
                    </div>
                )}

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%" }}>
                    {/* Logo */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        backgroundColor: "var(--surface-solid-secondary)", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, border: "2px solid var(--overlay)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>{clan.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{clan.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{clan.tag}</span>
                            {clan.is_recruiting && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--success)", backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                                    Reclutando
                                </span>
                            )}
                        </div>
                        {clan.description && (
                            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {clan.description}
                            </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Persons style={{ width: 12, height: 12 }} /> {memberCount}
                            </span>
                            {clan.game_name && (
                                <span style={{ backgroundColor: "var(--surface)", padding: "1px 6px", borderRadius: 4, fontSize: 10 }}>{clan.game_name}</span>
                            )}
                            {hasRating && (
                                <span><span style={{ color: "var(--foreground)" }}>★</span> {clanRating}</span>
                            )}
                            {clan.city && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="hidden sm:flex" style={{ gap: 2, flexShrink: 0 }}>
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{memberCount}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Miembros</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "var(--overlay)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{hasRating ? clanRating : "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "var(--overlay)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{clan.recruit_min_elo ?? "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>ELO Min</p>
                        </div>
                    </div>

                    {/* Chevron */}
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
