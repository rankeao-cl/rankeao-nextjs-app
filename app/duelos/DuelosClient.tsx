"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Duel } from "@/lib/types/duel";
import type { CatalogGame } from "@/lib/types/catalog";
import NewDuelModal from "./NewDuelModal";

// ── Status config ──

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#F59E0B",
    ACCEPTED: "#3B82F6",
    IN_PROGRESS: "#22C55E",
    AWAITING_CONFIRMATION: "#A855F7",
    COMPLETED: "#6B7280",
    DECLINED: "#EF4444",
    CANCELLED: "#6B7280",
    DISPUTED: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptado",
    IN_PROGRESS: "En curso",
    AWAITING_CONFIRMATION: "Esperando confirmacion",
    COMPLETED: "Finalizado",
    DECLINED: "Rechazado",
    CANCELLED: "Cancelado",
    DISPUTED: "Disputado",
};

// ── Tabs config ──

const TABS = [
    { key: "active", label: "Mis duelos" },
    { key: "invitations", label: "Invitaciones" },
    { key: "history", label: "Historial" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function filterByTab(duels: Duel[], tab: TabKey): Duel[] {
    switch (tab) {
        case "active":
            return duels.filter((d) => ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(d.status));
        case "invitations":
            return duels.filter((d) => d.status === "PENDING");
        case "history":
            return duels.filter((d) => ["COMPLETED", "DECLINED", "CANCELLED", "DISPUTED"].includes(d.status));
        default:
            return duels;
    }
}

// ── DuelCard ──

function DuelCard({ duel }: { duel: Duel }) {
    const sColor = STATUS_COLORS[duel.status] ?? "#888891";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const isActive = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
    const isPending = duel.status === "PENDING";

    return (
        <Link href={`/duelos/${duel.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#1A1A1E", overflow: "hidden" }}>
                {/* Top bar */}
                <div style={{ height: 4, backgroundColor: isActive ? sColor : "rgba(255,255,255,0.08)" }} />

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Players row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                        {/* Challenger */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                            {duel.challenger.avatar_url ? (
                                <Image src={duel.challenger.avatar_url} alt={duel.challenger.username} width={40} height={40} style={{ borderRadius: 999, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#888891" }}>
                                        {duel.challenger.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F2", maxWidth: "100%" }}>
                                {duel.challenger.display_name || duel.challenger.username}
                            </span>
                            <span className="truncate" style={{ fontSize: 10, color: "#888891", maxWidth: "100%" }}>
                                @{duel.challenger.username}
                            </span>
                        </div>

                        {/* VS divider */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            {(duel.challenger_wins != null && duel.opponent_wins != null) ? (
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#F2F2F2" }}>
                                    {duel.challenger_wins} - {duel.opponent_wins}
                                </span>
                            ) : (
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#888891" }}>VS</span>
                            )}
                        </div>

                        {/* Opponent */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                            {duel.opponent.avatar_url ? (
                                <Image src={duel.opponent.avatar_url} alt={duel.opponent.username} width={40} height={40} style={{ borderRadius: 999, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#888891" }}>
                                        {duel.opponent.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F2", maxWidth: "100%" }}>
                                {duel.opponent.display_name || duel.opponent.username}
                            </span>
                            <span className="truncate" style={{ fontSize: 10, color: "#888891", maxWidth: "100%" }}>
                                @{duel.opponent.username}
                            </span>
                        </div>
                    </div>

                    {/* Tags: game, format, bestof */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                        {duel.game_name && (
                            <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
                                {duel.game_name}
                            </span>
                        )}
                        {duel.format_name && (
                            <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                                {duel.format_name}
                            </span>
                        )}
                        <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                            Bo{duel.best_of}
                        </span>
                    </div>

                    {/* Status + CTA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 999, backgroundColor: sColor + "18" }}>
                            {isActive && (
                                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
                            )}
                            <span style={{ fontSize: 10, fontWeight: 700, color: sColor }}>{sLabel}</span>
                        </span>

                        <span style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            backgroundColor: isPending ? "#F59E0B" : isActive ? "#3B82F6" : "rgba(255,255,255,0.06)",
                            ...((!isPending && !isActive) ? { color: "#888891" } : {}),
                        }}>
                            {isPending ? "Responder" : isActive ? "Reportar resultado" : "Ver detalle"}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Main Client Component ──

interface DuelosClientProps {
    duels: Duel[];
    games: CatalogGame[];
    currentTab: string;
    currentQuery: string;
}

export default function DuelosClient({ duels, games, currentTab, currentQuery }: DuelosClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [modalOpen, setModalOpen] = useState(false);

    const tab = (TABS.find((t) => t.key === currentTab) ? currentTab : "active") as TabKey;
    const filtered = filterByTab(duels, tab);

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        if (key !== "page") params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <>
            {/* Hero header */}
            <section className="mx-4 lg:mx-6 mb-[14px] mt-3">
                <div
                    style={{
                        backgroundColor: "#1A1A1E",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 16,
                        padding: 18,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 120,
                        overflow: "hidden",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <span
                            style={{
                                display: "inline-block",
                                backgroundColor: "rgba(255,255,255,0.06)",
                                alignSelf: "flex-start",
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingTop: 4,
                                paddingBottom: 4,
                                borderRadius: 999,
                                marginBottom: 8,
                                color: "#888891",
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            Partidas casuales
                        </span>
                        <h1
                            style={{
                                color: "#F2F2F2",
                                fontSize: 22,
                                fontWeight: 800,
                                margin: 0,
                                marginBottom: 4,
                            }}
                        >
                            Duelos
                        </h1>
                        <p
                            style={{
                                color: "#888891",
                                fontSize: 13,
                                lineHeight: "18px",
                                margin: 0,
                            }}
                        >
                            Desafia a tus amigos o encuentra rivales.
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "#3B82F6",
                            borderRadius: 12,
                            paddingLeft: 14,
                            paddingRight: 14,
                            paddingTop: 8,
                            paddingBottom: 8,
                            marginLeft: 12,
                            alignSelf: "center",
                            border: "none",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Nuevo</span>
                    </button>
                </div>
            </section>

            {/* Search bar */}
            <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
                <form action="/duelos" method="GET" className="flex-1 flex items-center gap-2 bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] rounded-full px-[14px] py-[10px]">
                    {currentTab && <input type="hidden" name="tab" value={currentTab} />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        name="q"
                        placeholder="Buscar duelos..."
                        defaultValue={currentQuery}
                        className="flex-1 bg-transparent text-sm text-[#F2F2F2] placeholder-[#888891] outline-none"
                    />
                    {currentQuery && (
                        <a href={`/duelos?tab=${tab}`} className="shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </a>
                    )}
                </form>
            </div>

            {/* Tabs */}
            <div className="mx-4 lg:mx-6 mb-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => updateParam("tab", t.key)}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                tab === t.key
                                    ? "bg-[#F2F2F2] text-[#000000] border border-transparent"
                                    : "bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] text-[#888891] hover:text-[#F2F2F2]"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mx-4 lg:mx-6 mb-12">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((d) => (
                            <DuelCard key={d.id} duel={d} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#1A1A1E]">
                        <div className="py-16 text-center">
                            <p className="text-4xl mb-4">
                                {tab === "invitations" ? "📩" : tab === "history" ? "📋" : "⚔️"}
                            </p>
                            <p className="text-lg font-medium text-[#F2F2F2]">
                                {tab === "invitations"
                                    ? "No tienes invitaciones pendientes"
                                    : tab === "history"
                                    ? "Aun no tienes duelos finalizados"
                                    : "No tienes duelos activos"}
                            </p>
                            <p className="text-sm mt-1 text-[#888891]">
                                {tab === "active" && "Desafia a un amigo para comenzar"}
                            </p>
                            {tab === "active" && (
                                <button
                                    onClick={() => setModalOpen(true)}
                                    style={{
                                        marginTop: 16,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        backgroundColor: "#3B82F6",
                                        borderRadius: 12,
                                        padding: "10px 20px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#FFFFFF",
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Nuevo duelo
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <NewDuelModal open={modalOpen} onClose={() => setModalOpen(false)} games={games} />
        </>
    );
}
