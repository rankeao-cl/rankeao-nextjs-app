"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClan } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";

export default function MyClanBanner({ clan }: { clan: Clan }) {
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

    return (
        <div className="mx-4 lg:mx-6 mb-3">
            <Link href={`/clanes/${clan.slug || clan.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                    borderRadius: 16, overflow: "hidden",
                    border: "1px solid rgba(59,130,246,0.25)",
                    position: "relative",
                }}>
                    {/* Banner background */}
                    <div style={{ height: 80, position: "relative", overflow: "hidden" }}>
                        {bannerUrl ? (
                            <img src={bannerUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : logoUrl ? (
                            <img src={logoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.3 }} />
                        ) : (
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,130,246,0.15), var(--surface-solid))" }} />
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))" }} />

                        {/* Content over banner */}
                        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 16px", gap: 14 }}>
                            {/* Logo */}
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                border: "2px solid var(--border)",
                                backgroundColor: "var(--surface-solid-secondary)", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            }}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>
                                        {clan.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Mi Clan</p>
                                <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.name}</p>
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, marginTop: 1 }}>
                                    [{clan.tag}] · {clan.member_count ?? 0} miembros
                                </p>
                            </div>

                            {/* Chevron */}
                            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
