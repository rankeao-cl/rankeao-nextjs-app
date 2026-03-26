"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDuels } from "@/lib/api/duels";
import type { Duel } from "@/lib/types/duel";
import type { CatalogGame } from "@/lib/types/catalog";
import { DuelCard } from "@/components/cards";
import NewDuelModal from "./NewDuelModal";


// ── Tabs config — matches Expo ──

const TABS = [
    { key: "active", label: "Activos" },
    { key: "invitations", label: "Recibidos" },
    { key: "sent", label: "Enviados" },
    { key: "history", label: "Historial" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function filterByTab(duels: Duel[], tab: TabKey, myUsername?: string): Duel[] {
    switch (tab) {
        case "active":
            return duels.filter((d) => ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(d.status));
        case "invitations":
            return duels.filter((d) => d.status === "PENDING" && d.opponent.username === myUsername);
        case "sent":
            return duels.filter((d) => d.status === "PENDING" && d.challenger.username === myUsername);
        case "history":
            return duels.filter((d) => ["COMPLETED", "DECLINED", "CANCELLED"].includes(d.status));
        default:
            return duels;
    }
}

// ── Main Client Component ──

interface DuelosClientProps {
    duels: Duel[];
    games: CatalogGame[];
    currentTab: string;
    currentQuery: string;
}

export default function DuelosClient({ duels: initialDuels, games, currentTab, currentQuery }: DuelosClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { session } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [duels, setDuels] = useState<Duel[]>(initialDuels);

    const myUsername = session?.username;
    const token = session?.accessToken;

    // Re-fetch duels client-side with auth token
    const fetchDuels = useCallback(async () => {
        if (!token) return;
        try {
            const res = await getDuels({ per_page: 50 }, token);
            if (res?.duels) setDuels(res.duels);
        } catch (err) { console.error("[Duelos] Error fetching duels:", err); }
    }, [token]);

    useEffect(() => {
        fetchDuels();
    }, [fetchDuels]);

    const tab = (TABS.find((t) => t.key === currentTab) ? currentTab : "active") as TabKey;
    const filtered = useMemo(() => filterByTab(duels, tab, myUsername), [duels, tab, myUsername]);

    const pendingCount = useMemo(
        () => duels.filter((d) => d.status === "PENDING" && d.opponent.username === myUsername).length,
        [duels, myUsername]
    );

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        if (key !== "page") params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <>
            {/* Hero banner — matches Expo */}
            <section className="mx-4 lg:mx-6 mb-[14px] mt-3">
                <div
                    style={{
                        backgroundColor: "var(--surface-solid)",
                        border: "1px solid var(--border)",
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
                                backgroundColor: "var(--surface)",
                                alignSelf: "flex-start",
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingTop: 4,
                                paddingBottom: 4,
                                borderRadius: 999,
                                marginBottom: 8,
                                color: "var(--muted)",
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            Partidas casuales
                        </span>
                        <h1
                            style={{
                                color: "var(--foreground)",
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
                                color: "var(--muted)",
                                fontSize: 13,
                                lineHeight: "18px",
                                margin: 0,
                            }}
                        >
                            Desafia a tus amigos o encuentra rivales. Solo XP, sin ELO.
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "var(--accent)",
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
                <form action="/duelos" method="GET" className="flex-1 flex items-center gap-2 bg-surface-solid border border-border rounded-full px-[14px] py-[10px]">
                    {currentTab && <input type="hidden" name="tab" value={currentTab} />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        name="q"
                        placeholder="Buscar duelos..."
                        defaultValue={currentQuery}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
                    />
                    {currentQuery && (
                        <a href={`/duelos?tab=${tab}`} className="shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </a>
                    )}
                </form>
            </div>

            {/* Tabs — 4 pills matching Expo */}
            <div className="mx-4 lg:mx-6 mb-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {TABS.map((t) => {
                        const active = tab === t.key;
                        const showBadge = t.key === "invitations" && pendingCount > 0;
                        return (
                            <button
                                key={t.key}
                                onClick={() => updateParam("tab", t.key)}
                                className="cursor-pointer whitespace-nowrap transition-colors"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    paddingLeft: 16,
                                    paddingRight: 16,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                    borderRadius: 999,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    backgroundColor: active ? "var(--foreground)" : "var(--surface-solid)",
                                    color: active ? "var(--background)" : "var(--muted)",
                                    border: active ? "1px solid transparent" : "1px solid var(--border)",
                                }}
                            >
                                {t.label}
                                {showBadge && (
                                    <span style={{
                                        backgroundColor: "var(--danger)",
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingLeft: 4,
                                        paddingRight: 4,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#fff",
                                    }}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="mx-4 lg:mx-6 mb-12">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
                        {filtered.map((d) => (
                            <DuelCard key={d.id} duel={d} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-surface-solid">
                        <div className="py-16 text-center">
                            <p className="text-4xl mb-4">
                                {tab === "invitations" ? "📩" : tab === "sent" ? "📤" : tab === "history" ? "📋" : "⚔️"}
                            </p>
                            <p className="text-lg font-medium text-foreground">
                                {tab === "invitations"
                                    ? "Sin invitaciones"
                                    : tab === "sent"
                                    ? "Sin desafios enviados"
                                    : tab === "history"
                                    ? "Sin historial"
                                    : "Sin duelos activos"}
                            </p>
                            <p className="text-sm mt-1 text-muted">
                                {tab === "active" && "Desafia a alguien para empezar"}
                            </p>
                            {tab === "active" && (
                                <button
                                    onClick={() => setModalOpen(true)}
                                    style={{
                                        marginTop: 16,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        backgroundColor: "var(--accent)",
                                        borderRadius: 10,
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

            <NewDuelModal open={modalOpen} onClose={() => { setModalOpen(false); fetchDuels(); }} games={games} />
        </>
    );
}
