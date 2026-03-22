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
            .then((res: any) => {
                const detail = res?.data?.clan ?? res?.data ?? res?.clan ?? res;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    const hasRating = clan.rating != null && clan.rating > 0;
    const memberCount = clan.member_count ?? 0;

    return (
        <Link href={`/clanes/${clan.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "#1A1A1E", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
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
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,26,30,0.92), rgba(26,26,30,0.75))" }} />
                    </div>
                )}

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%" }}>
                    {/* Logo */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        backgroundColor: "#222226", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>{clan.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{clan.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.2)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{clan.tag}</span>
                            {clan.is_recruiting && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                                    Reclutando
                                </span>
                            )}
                        </div>
                        {clan.description && (
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {clan.description}
                            </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#888891" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Persons style={{ width: 12, height: 12 }} /> {memberCount}
                            </span>
                            {clan.game_name && (
                                <span style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4, fontSize: 10 }}>{clan.game_name}</span>
                            )}
                            {hasRating && (
                                <span><span style={{ color: "#F59E0B" }}>★</span> {clan.rating!.toFixed(1)}</span>
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
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{memberCount}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Miembros</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "#888891", margin: 0 }}>{hasRating ? clan.rating!.toFixed(1) : "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{clan.recruit_min_elo ?? "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>ELO Min</p>
                        </div>
                    </div>

                    {/* Chevron */}
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M6 3l5 5-5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
