"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClan } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";

export default function ClanCard({ clan }: { clan: Clan }) {
    const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
    const [logoUrl, setLogoUrl] = useState(clan.logo_url || "");

    useEffect(() => {
        if (bannerUrl && logoUrl) return;
        getClan(clan.id)
            .then((res: any) => {
                const detail = res?.data?.clan ?? res?.data ?? res?.clan ?? res;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    const memberCount = clan.member_count ?? 0;
    const hasRating = clan.rating != null && clan.rating > 0;

    return (
        <Link href={`/clanes/${clan.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div style={{
                backgroundColor: "var(--surface-solid)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}>
                {/* Banner — large, immersive */}
                <div style={{ height: 110, position: "relative", overflow: "hidden" }}>
                    {bannerUrl ? (
                        <img src={bannerUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : logoUrl ? (
                        <img src={logoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.25 }} />
                    ) : (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b, #0f172a)" }} />
                    )}
                    {/* Dark overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--surface-solid) 0%, rgba(26,26,30,0.6) 50%, rgba(0,0,0,0.2) 100%)" }} />

                    {/* Badges floating on banner */}
                    <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        {/* Left: location */}
                        <div>
                            {clan.city && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                        {/* Right: tags */}
                        <div style={{ display: "flex", gap: 4 }}>
                            {clan.is_recruiting && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    Reclutando
                                </span>
                            )}
                            {clan.game_name && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--foreground)", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    {clan.game_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Logo + Name overlaid on banner bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px", display: "flex", alignItems: "flex-end", gap: 12 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            border: "3px solid var(--surface-solid)",
                            backgroundColor: "var(--surface-solid)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                        }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>
                                    {clan.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                    {clan.name}
                                </h3>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.2)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
                                    {clan.tag}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Description */}
                    {clan.description ? (
                        <p className="line-clamp-2" style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginBottom: 10, lineHeight: "17px" }}>
                            {clan.description}
                        </p>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}

                    {/* Stats row — gaming style */}
                    <div style={{
                        display: "flex", alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderRadius: 10, padding: "8px 10px",
                        gap: 4,
                    }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{memberCount}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Miembros</p>
                        </div>
                        <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "var(--foreground)", margin: 0 }}>
                                {hasRating ? clan.rating!.toFixed(1) : "—"}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
                        </div>
                        <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
                                {clan.recruit_min_elo ?? "—"}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>ELO Min</p>
                        </div>
                    </div>

                </div>
            </div>
        </Link>
    );
}
