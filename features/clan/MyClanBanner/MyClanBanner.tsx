"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getClan } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";

export default function MyClanBanner({ clan }: { clan: Clan }) {
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

    return (
        <div className="mx-4 lg:mx-6 mb-3">
            <Link href={`/clanes/${clan.slug || clan.id}`} className="no-underline">
                <div className="rounded-[16px] overflow-hidden border border-[rgba(59,130,246,0.25)] relative">
                    {/* Banner background */}
                    <div className="h-[80px] relative overflow-hidden">
                        {bannerUrl ? (
                            <Image src={bannerUrl} alt="" fill sizes="100vw" className="object-cover" />
                        ) : logoUrl ? (
                            <Image src={logoUrl} alt="" fill sizes="100vw" className="object-cover scale-[3] blur-[24px] opacity-[0.3]" />
                        ) : (
                            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), var(--surface-solid))" }} />
                        )}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))" }} />

                        {/* Content over banner */}
                        <div className="relative z-[1] h-full flex items-center px-4 gap-3.5">
                            {/* Logo */}
                            <div
                                className="w-[52px] h-[52px] rounded-[14px] border-2 border-border bg-surface-solid-secondary overflow-hidden flex items-center justify-center shrink-0 relative"
                                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                            >
                                {logoUrl ? (
                                    <Image src={logoUrl} alt={clan.name} fill sizes="52px" className="object-cover" />
                                ) : (
                                    <span className="text-[22px] font-black text-accent">
                                        {clan.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-accent uppercase tracking-[1px] m-0">Mi Clan</p>
                                <p className="text-[16px] font-bold text-white m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{clan.name}</p>
                                <p className="text-[11px] text-muted m-0 mt-px">
                                    [{clan.tag}] &middot; {clan.member_count ?? 0} miembros
                                </p>
                            </div>

                            {/* Chevron */}
                            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" className="shrink-0">
                                <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
