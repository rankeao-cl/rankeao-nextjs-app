"use client";

import { useEffect, useState } from "react";
import { Cup, Persons, MapPin, Clock } from "@gravity-ui/icons";
import { getTournamentStandings } from "@/lib/api/tournaments";
import type { Tournament, Standing } from "@/lib/types/tournament";
import Link from "next/link";
import Image from "next/image";

const PLACE_EMOJI: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

export default function PastTournamentCard({ tournament }: { tournament: Tournament }) {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getTournamentStandings(tournament.id)
            .then((res: any) => {
                const raw = res?.data?.standings ?? res?.standings ?? [];
                if (mounted && Array.isArray(raw)) setStandings(raw.slice(0, 3));
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [tournament.id]);

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
        : null;

    const gameBrandColor = "#6B7280";

    return (
        <Link href={`/torneos/${tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "#1A1A1E",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
            }}>
                {/* Muted top bar */}
                <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)" }} />

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {tournament.tenant_logo_url ? (
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
                            }}>
                                <Image
                                    src={tournament.tenant_logo_url}
                                    alt={tournament.tenant_name || ""}
                                    width={44}
                                    height={44}
                                    style={{ width: 44, height: 44, objectFit: "cover" }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, overflow: "hidden",
                                border: `1px solid ${gameBrandColor}30`,
                                backgroundColor: `${gameBrandColor}15`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: gameBrandColor }}>
                                    {tournament.game?.slice(0, 3).toUpperCase() || "TCG"}
                                </span>
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: 700, fontSize: 14, color: "#F2F2F2",
                                lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis",
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            }}>
                                {tournament.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#888891", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {tournament.tenant_name || "Torneo finalizado"}
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: "rgba(255,255,255,0.06)",
                            paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
                            borderRadius: 999, flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#888891" }}>Finalizado</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tournament.game && (
                            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 8 }}>
                                <span style={{ fontSize: 11, color: "#888891" }}>{tournament.game_name || tournament.game}</span>
                            </div>
                        )}
                        {tournament.format && (
                            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 8 }}>
                                <span style={{ fontSize: 11, color: "#888891" }}>{tournament.format_name || tournament.format}</span>
                            </div>
                        )}
                        {tournament.is_ranked && (
                            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#888891" }}>Ranked</span>
                            </div>
                        )}
                    </div>

                    {/* Podium */}
                    <div style={{
                        borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
                        overflow: "hidden", backgroundColor: "rgba(255,255,255,0.02)",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}>
                            <Cup style={{ width: 13, height: 13, color: "#888891" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#888891", textTransform: "uppercase", letterSpacing: 1 }}>
                                Podio
                            </span>
                        </div>
                        <div style={{ padding: 6 }}>
                            {loading ? (
                                <div style={{ paddingTop: 14, paddingBottom: 14, display: "flex", justifyContent: "center" }}>
                                    <div style={{
                                        width: 16, height: 16, border: "2px solid rgba(255,255,255,0.1)",
                                        borderTopColor: "#888891", borderRadius: "50%",
                                        animation: "spin 0.8s linear infinite",
                                    }} />
                                </div>
                            ) : standings.length > 0 ? (
                                standings.map((p) => (
                                    <div
                                        key={p.user_id}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
                                            borderRadius: 8,
                                        }}
                                    >
                                        <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>
                                            {PLACE_EMOJI[p.rank] || `#${p.rank}`}
                                        </span>
                                        <div style={{
                                            width: 26, height: 26, borderRadius: 13,
                                            backgroundColor: "rgba(255,255,255,0.06)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#F2F2F2" }}>
                                                {p.username?.[0]?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                        <span style={{
                                            flex: 1, fontSize: 13, fontWeight: 600, color: "#F2F2F2",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {p.username}
                                        </span>
                                        <span style={{ fontSize: 10, color: "#888891", flexShrink: 0 }}>
                                            {p.points}pts · {p.wins}W-{p.losses}L
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: 11, color: "#888891", textAlign: "center", paddingTop: 12, paddingBottom: 12, fontStyle: "italic" }}>
                                    Sin resultados
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info + count */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {date && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888891" }}>
                                    <Clock style={{ width: 12, height: 12 }} /> {date}
                                </span>
                            )}
                            {tournament.city && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888891", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <MapPin style={{ width: 12, height: 12 }} /> {tournament.city}
                                </span>
                            )}
                        </div>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888891" }}>
                            <Persons style={{ width: 12, height: 12 }} /> {tournament.registered_count ?? tournament.current_players ?? 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
