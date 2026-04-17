"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getClan } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";

export default function ClanCard({ clan }: { clan: Clan }) {
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
                console.warn("No se pudo cargar detalle de clan", error);
            });
    }, [clan.id]);

    const memberCount = clan.member_count ?? 0;
    const clanRating = clan.clan_rating ?? clan.rating;
    const hasRating = clanRating != null && clanRating > 0;

    return (
        <Link href={`/clanes/${clan.slug || clan.id}`} className="no-underline block h-full">
            <div className="bg-surface-solid rounded-[20px] border border-border overflow-hidden h-full flex flex-col">
                {/* Banner — large, immersive */}
                <div className="h-[110px] relative overflow-hidden">
                    {bannerUrl ? (
                        <Image src={bannerUrl} alt="" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
                    ) : logoUrl ? (
                        <Image src={logoUrl} alt="" fill sizes="400px" className="object-cover scale-[3] blur-[24px] opacity-25" />
                    ) : (
                        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--surface-solid), var(--surface-solid-secondary))" }} />
                    )}
                    {/* Dark overlay */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.1) 100%)" }} />

                    {/* Badges floating on banner */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start">
                        {/* Left: location */}
                        <div>
                            {clan.city && (
                                <span
                                    className="text-[10px] font-semibold rounded-full inline-flex items-center gap-[3px] px-2 py-[3px]"
                                    style={{ color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                                >
                                    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                        {/* Right: tags */}
                        <div className="flex gap-1">
                            {clan.is_recruiting && (
                                <span
                                    className="text-[10px] font-bold text-success rounded-full px-2.5 py-[3px]"
                                    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                                >
                                    Reclutando
                                </span>
                            )}
                            {clan.game_name && (
                                <span
                                    className="text-[10px] font-semibold text-foreground rounded-full px-2.5 py-[3px]"
                                    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                                >
                                    {clan.game_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Logo + Name overlaid on banner bottom */}
                    <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 flex items-end gap-3">
                        <div
                            className="w-[52px] h-[52px] rounded-[14px] border-[3px] border-surface-solid bg-surface-solid overflow-hidden flex items-center justify-center shrink-0"
                            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
                        >
                            {logoUrl ? (
                                <Image src={logoUrl} alt={clan.name} width={52} height={52} className="object-cover" />
                            ) : (
                                <span className="text-[20px] font-black text-accent">
                                    {clan.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 mb-0.5">
                            <div className="flex items-center gap-1.5">
                                <h3
                                    className="text-[16px] font-extrabold text-white m-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                                >
                                    {clan.name}
                                </h3>
                                <span
                                    className="text-[10px] font-bold text-accent shrink-0 py-px px-1.5 rounded-[4px]"
                                    style={{ backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}
                                >
                                    {clan.tag}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-3.5 pt-2.5 pb-3.5 flex-1 flex flex-col">
                    {/* Description */}
                    {clan.description ? (
                        <p className="line-clamp-2 text-[12px] text-muted m-0 mb-2.5 leading-[17px]">
                            {clan.description}
                        </p>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {/* Stats row — gaming style */}
                    <div className="flex items-center bg-surface rounded-[10px] px-2.5 py-2 gap-1">
                        <div className="flex-1 text-center">
                            <p className="text-[14px] font-extrabold text-foreground m-0">{memberCount}</p>
                            <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Miembros</p>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex-1 text-center">
                            <p className="text-[14px] font-extrabold text-foreground m-0">
                                {hasRating ? clanRating : "\u2014"}
                            </p>
                            <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Rating</p>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex-1 text-center">
                            <p className="text-[14px] font-extrabold text-foreground m-0">
                                {clan.recruit_min_elo ?? "\u2014"}
                            </p>
                            <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">ELO Min</p>
                        </div>
                    </div>

                </div>
            </div>
        </Link>
    );
}
