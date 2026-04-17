"use client";

import Image from "next/image";
import { Person, MapPin, CircleCheck, Star, EllipsisVertical } from "@gravity-ui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/types/social";

interface ProfileHeaderProps {
    profile: UserProfile;
    name: string;
    bio: string;
    level: number;
    ringColor: string;
    rankGradient: string;
    xpProgress: number;
    totalXp: number;
    currentLevelXp: number;
    xpToNextLevel: number;
    xpBarColor: string;
    xpRank: number;
    equippedTitle: string;
    isVerified: boolean;
    isPremium: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    followersCount: number;
    followingCount: number;
    friendsCount: number;
    location: string;
    isOwnProfile: boolean;
    isFollowing: boolean;
    followLoading: boolean;
    onFollow: () => void;
    onEditProfile: () => void;
    clanInline: React.ReactNode;
    usernameParam: string;
}

export default function ProfileHeader({
    profile,
    name,
    bio,
    level,
    ringColor,
    rankGradient,
    xpProgress,
    totalXp,
    currentLevelXp,
    xpToNextLevel,
    xpBarColor,
    xpRank,
    equippedTitle,
    isVerified,
    isPremium,
    isAdmin,
    isModerator,
    followersCount,
    followingCount,
    friendsCount,
    location,
    isOwnProfile,
    isFollowing,
    followLoading,
    onFollow,
    onEditProfile,
    clanInline,
    usernameParam,
}: ProfileHeaderProps) {
    const router = useRouter();
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const bannerUrl = profile?.banner_url;

    return (
        <div className="relative w-full">
            {/* Banner gradient (or custom image) */}
            <div className="w-full h-[200px] relative overflow-hidden">
                {bannerUrl ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${bannerUrl}')` }}
                        />
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to bottom, transparent 40%, var(--background) 100%)" }}
                        />
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0" style={{ background: rankGradient }} />
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to bottom, transparent 50%, var(--background) 100%)" }}
                        />
                        {/* Subtle noise texture */}
                        <div
                            className="absolute inset-0 opacity-[0.06]"
                            style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')" }}
                        />
                    </>
                )}
            </div>

            {/* Profile info overlay */}
            <div className="max-w-[960px] mx-auto w-full px-4 relative -mt-[60px]">
                <div className="flex items-end gap-4 flex-wrap">
                    {/* Avatar with rank ring + level badge */}
                    <div className="relative shrink-0">
                        <div
                            className="w-[88px] h-[88px] rounded-full p-[3px]"
                            style={{
                                background: `linear-gradient(135deg, ${ringColor}, ${ringColor}88)`,
                                boxShadow: `0 0 20px ${ringColor}40`,
                            }}
                        >
                            <div
                                className="w-[82px] h-[82px] rounded-full overflow-hidden relative"
                                style={{
                                    border: "3px solid var(--background)",
                                    backgroundColor: "var(--surface-solid)",
                                }}
                            >
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt={name} fill sizes="82px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Person width={36} height={36} color="var(--muted)" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Level badge */}
                        {level > 0 && (
                            <div
                                className="absolute -bottom-0.5 -right-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center"
                                style={{
                                    background: ringColor,
                                    border: "2px solid var(--background)",
                                    boxShadow: `0 2px 8px ${ringColor}60`,
                                }}
                            >
                                <span className="text-[10px] font-extrabold text-[var(--accent-foreground)]">{level}</span>
                            </div>
                        )}
                    </div>

                    {/* Name + title + meta */}
                    <div className="flex-1 min-w-[200px] pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[22px] font-extrabold leading-tight m-0" style={{ color: "var(--foreground)" }}>
                                {name}
                            </h1>
                            {isVerified && <CircleCheck width={16} height={16} color="var(--accent)" />}
                            {isPremium && <Star width={16} height={16} color="var(--warning)" />}
                            {isAdmin && (
                                <span className="text-[9px] font-bold text-[var(--danger-foreground)] rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--danger)" }}>
                                    ADMIN
                                </span>
                            )}
                            {isModerator && (
                                <span className="text-[9px] font-bold text-[var(--accent-foreground)] rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--accent)" }}>
                                    MOD
                                </span>
                            )}
                        </div>
                        {equippedTitle ? (
                            <p className="text-[13px] font-semibold m-0 mt-0.5" style={{ color: ringColor }}>{equippedTitle}</p>
                        ) : (
                            <p className="text-[13px] m-0 mt-0.5" style={{ color: "var(--muted)" }}>@{profile?.username || usernameParam}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {location && (
                                <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                    <MapPin width={12} height={12} /> {location}
                                </span>
                            )}
                            {profile?.created_at && (
                                <span className="text-xs" style={{ color: "var(--muted)" }}>
                                    Desde {new Date(profile.created_at).toLocaleDateString("es-CL", { month: "short", year: "numeric" })}
                                </span>
                            )}
                            {clanInline && <span>{clanInline}</span>}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 items-center pb-1">
                        {isOwnProfile ? (
                            <>
                                <button
                                    onClick={onEditProfile}
                                    className="rounded-full px-5 py-2 text-[13px] font-semibold cursor-pointer backdrop-blur-lg"
                                    style={{
                                        backgroundColor: "color-mix(in srgb, var(--overlay) 45%, transparent)",
                                        color: "var(--foreground)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    Editar perfil
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer backdrop-blur-lg"
                                    style={{
                                        backgroundColor: "color-mix(in srgb, var(--overlay) 45%, transparent)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                        <polyline points="16,6 12,2 8,6" />
                                        <line x1={12} y1={2} x2={12} y2={15} />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onFollow}
                                    disabled={followLoading}
                                    className="rounded-full px-6 py-2 text-[13px] font-bold"
                                    style={{
                                        backgroundColor: isFollowing ? "color-mix(in srgb, var(--overlay) 45%, transparent)" : ringColor,
                                        color: isFollowing ? "var(--foreground)" : "var(--accent-foreground)",
                                        border: isFollowing ? "1px solid var(--border)" : "none",
                                        cursor: followLoading ? "not-allowed" : "pointer",
                                        opacity: followLoading ? 0.6 : 1,
                                        boxShadow: isFollowing ? "none" : `0 2px 12px ${ringColor}50`,
                                    }}
                                >
                                    {isFollowing ? "Siguiendo" : "Seguir"}
                                </button>
                                <button
                                    onClick={() => router.push(`/chat?user=${profile?.username}`)}
                                    className="rounded-full px-5 py-2 text-[13px] font-semibold cursor-pointer backdrop-blur-lg"
                                    style={{
                                        backgroundColor: "color-mix(in srgb, var(--overlay) 45%, transparent)",
                                        color: "var(--foreground)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    Mensaje
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                                        className="w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer backdrop-blur-lg"
                                        style={{
                                            backgroundColor: "color-mix(in srgb, var(--overlay) 45%, transparent)",
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        <EllipsisVertical width={14} height={14} color="var(--foreground)" />
                                    </button>
                                    {showMoreOptions && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowMoreOptions(false)} />
                                            <div
                                                className="absolute right-0 top-full mt-1 z-50 w-[200px] rounded-xl overflow-hidden"
                                                style={{
                                                    border: "1px solid var(--border)",
                                                    backgroundColor: "var(--surface-solid)",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                                }}
                                            >
                                                <button
                                                    className="w-full text-left py-2.5 px-3.5 text-[13px] bg-transparent border-none cursor-pointer"
                                                    style={{ color: "var(--foreground)" }}
                                                    onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMoreOptions(false); }}
                                                >
                                                    Copiar enlace al perfil
                                                </button>
                                                <button
                                                    className="w-full text-left py-2.5 px-3.5 text-[13px] bg-transparent border-none cursor-pointer"
                                                    style={{ color: "var(--foreground)" }}
                                                    onClick={() => setShowMoreOptions(false)}
                                                >
                                                    Enviar solicitud de amistad
                                                </button>
                                                <button
                                                    className="w-full text-left py-2.5 px-3.5 text-[13px] bg-transparent border-none cursor-pointer"
                                                    style={{ color: "var(--danger)" }}
                                                    onClick={() => setShowMoreOptions(false)}
                                                >
                                                    Reportar usuario
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Social counts */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                        <span className="font-bold" style={{ color: "var(--foreground)" }}>{followersCount}</span> seguidores
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--border)" }}>&middot;</span>
                    <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                        <span className="font-bold" style={{ color: "var(--foreground)" }}>{followingCount}</span> siguiendo
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--border)" }}>&middot;</span>
                    <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                        <span className="font-bold" style={{ color: "var(--foreground)" }}>{friendsCount}</span> amigos
                    </span>
                </div>

                {/* Bio */}
                {bio && (
                    <p className="text-sm leading-relaxed m-0 mt-2.5 max-w-[600px]" style={{ color: "var(--foreground)" }}>
                        {bio}
                    </p>
                )}

                {/* XP progress bar */}
                {(totalXp > 0 || level > 0) && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                                Nivel {level} &mdash; {currentLevelXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
                            </span>
                            {xpRank > 0 && (
                                <span className="text-[11px]" style={{ color: "var(--muted)" }}>#{xpRank} global</span>
                            )}
                        </div>
                        <div
                            className="h-1 rounded-sm overflow-hidden w-full"
                            style={{ backgroundColor: "var(--surface-secondary)" }}
                        >
                            <div
                                className="h-full rounded-sm transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{
                                    backgroundColor: xpBarColor,
                                    width: `${xpProgress}%`,
                                    boxShadow: `0 0 8px ${xpBarColor}60`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
