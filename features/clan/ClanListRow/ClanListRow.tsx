"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
            .catch((error: unknown) => {
                console.warn("No se pudo cargar detalle del clan", error);
            });
    }, [clan.id]);

    const clanRating = clan.clan_rating ?? clan.rating;
    const hasRating = clanRating != null && clanRating > 0;
    const memberCount = clan.member_count ?? 0;

    return (
        <Link href={`/clanes/${clan.slug || clan.id}`} className="no-underline block">
            <div className="bg-surface-solid rounded-[16px] border border-surface overflow-hidden flex relative">
                {/* Banner background — stretches full width behind content */}
                {(bannerUrl || logoUrl) && (
                    <div className="absolute inset-0 overflow-hidden">
                        <Image
                            src={bannerUrl || logoUrl}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 600px"
                            className={`object-cover ${!bannerUrl ? "scale-[3] blur-[24px] opacity-15" : ""}`}
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--surface-solid) 92%, transparent), color-mix(in srgb, var(--surface-solid) 75%, transparent))" }} />
                    </div>
                )}

                {/* Content */}
                <div className="relative z-[1] flex items-center gap-3.5 px-4 py-3.5 w-full">
                    {/* Logo */}
                    <div
                        className="w-[52px] h-[52px] rounded-[14px] bg-surface-solid-secondary overflow-hidden flex items-center justify-center shrink-0 border-2 border-[var(--overlay)]"
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                    >
                        {logoUrl ? (
                            <Image src={logoUrl} alt={clan.name} width={52} height={52} className="object-cover" />
                        ) : (
                            <span className="text-[20px] font-black text-accent">{clan.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-[3px]">
                            <span
                                className="text-[15px] font-extrabold text-white overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                            >
                                {clan.name}
                            </span>
                            <span
                                className="text-[10px] font-bold text-accent py-0.5 px-1.5 rounded-[4px] shrink-0"
                                style={{ backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}
                            >
                                {clan.tag}
                            </span>
                            {clan.is_recruiting && (
                                <span
                                    className="text-[9px] font-bold text-success py-0.5 px-2 rounded-full shrink-0"
                                    style={{ backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)" }}
                                >
                                    Reclutando
                                </span>
                            )}
                        </div>
                        {clan.description && (
                            <p className="text-[12px] text-muted m-0 mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                {clan.description}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-[3px]">
                                <Persons className="w-3 h-3" /> {memberCount}
                            </span>
                            {clan.game_name && (
                                <span className="bg-surface py-px px-1.5 rounded-[4px] text-[10px]">{clan.game_name}</span>
                            )}
                            {hasRating && (
                                <span><span className="text-foreground">&#9733;</span> {clanRating}</span>
                            )}
                            {clan.city && (
                                <span className="flex items-center gap-[3px]">
                                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="hidden sm:flex gap-0.5 shrink-0">
                        <div className="text-center px-2.5 py-1">
                            <p className="text-[14px] font-extrabold text-foreground m-0">{memberCount}</p>
                            <p className="text-[8px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Miembros</p>
                        </div>
                        <div className="w-px h-7 bg-[var(--overlay)] self-center" />
                        <div className="text-center px-2.5 py-1">
                            <p className="text-[14px] font-extrabold text-foreground m-0">{hasRating ? clanRating : "\u2014"}</p>
                            <p className="text-[8px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Rating</p>
                        </div>
                        <div className="w-px h-7 bg-[var(--overlay)] self-center" />
                        <div className="text-center px-2.5 py-1">
                            <p className="text-[14px] font-extrabold text-foreground m-0">{clan.recruit_min_elo ?? "\u2014"}</p>
                            <p className="text-[8px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">ELO Min</p>
                        </div>
                    </div>

                    {/* Chevron */}
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
