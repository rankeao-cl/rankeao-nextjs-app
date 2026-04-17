"use client";

import { useEffect, useState } from "react";
import { Cup, Persons, MapPin, Clock } from "@gravity-ui/icons";
import { getTournamentStandings } from "@/lib/api/tournaments";
import { mapErrorMessage } from "@/lib/api/errors";
import type { Tournament, Standing } from "@/lib/types/tournament";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@heroui/react/toast";

const PLACE_EMOJI: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

export default function PastTournamentCard({ tournament }: { tournament: Tournament }) {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getTournamentStandings(tournament.id)
            .then((res: { data?: { standings?: Standing[] }; standings?: Standing[] }) => {
                const raw = res?.data?.standings ?? res?.standings ?? [];
                if (mounted && Array.isArray(raw)) setStandings(raw.slice(0, 3));
            })
            .catch((error: unknown) => {
                toast.danger("Error", { description: mapErrorMessage(error) });
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [tournament.id]);

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
        : null;

    const bgImage = tournament.banner_url || tournament.game_logo_url || tournament.tenant_logo_url || null;

    return (
        <Link href={`/torneos/${tournament.slug ?? tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                overflow: "hidden",
            }}>
                {/* Banner con overlay degradado */}
                <div className="relative overflow-hidden" style={{ height: 88 }}>
                    {bgImage ? (
                        <Image
                            src={bgImage}
                            alt={tournament.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover opacity-40"
                        />
                    ) : (
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(135deg, var(--surface-tertiary) 0%, var(--surface-secondary) 100%)" }}
                        />
                    )}
                    {/* Overlay degradado inferior hacia fondo de la card */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to bottom, color-mix(in srgb, var(--surface-solid) 20%, transparent) 0%, color-mix(in srgb, var(--surface-solid) 70%, transparent) 60%, var(--surface-solid) 100%)",
                        }}
                    />

                    {/* Chip Finalizado */}
                    <div className="absolute top-2.5 right-2.5">
                        <span
                            className="px-2 py-1 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: "var(--overlay)", color: "var(--muted)" }}
                        >
                            Finalizado
                        </span>
                    </div>

                    {/* Logo organizador */}
                    {tournament.tenant_logo_url && (
                        <div className="absolute top-2.5 left-2.5">
                            <div
                                className="w-7 h-7 rounded-lg overflow-hidden"
                                style={{ border: "1px solid var(--border)" }}
                            >
                                <Image
                                    src={tournament.tenant_logo_url}
                                    alt={tournament.tenant_name || ""}
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Nombre en la parte inferior del banner */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                        <p className="font-bold text-[13px] text-[var(--foreground)] line-clamp-1">
                            {tournament.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] truncate">
                            {tournament.tenant_name || tournament.organizer_name || "Torneo finalizado"}
                        </p>
                    </div>
                </div>

                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {tournament.game && (
                            <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 8 }}>
                                {tournament.game_name || tournament.game}
                            </span>
                        )}
                        {tournament.format && (
                            <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 8 }}>
                                {tournament.format_name || tournament.format}
                            </span>
                        )}
                        {tournament.is_ranked && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 8 }}>
                                Ranked
                            </span>
                        )}
                    </div>

                    {/* Podium */}
                    <div style={{
                        borderRadius: 12, border: "1px solid var(--border)",
                        overflow: "hidden", backgroundColor: "var(--surface-tertiary)",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            backgroundColor: "var(--surface-tertiary)",
                            borderBottom: "1px solid var(--border)",
                        }}>
                            <Cup style={{ width: 13, height: 13, color: "var(--muted)" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                                Podio
                            </span>
                        </div>
                        <div style={{ padding: 6 }}>
                            {loading ? (
                                <div style={{ paddingTop: 14, paddingBottom: 14, display: "flex", justifyContent: "center" }}>
                                    <div style={{
                                        width: 16, height: 16, border: "2px solid var(--overlay)",
                                        borderTopColor: "var(--muted)", borderRadius: "50%",
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
                                            {PLACE_EMOJI[p.rank] || (p.rank != null ? `#${p.rank}` : "—")}
                                        </span>
                                        <div style={{
                                            width: 26, height: 26, borderRadius: 13,
                                            backgroundColor: "var(--surface)",
                                            border: "1px solid var(--border)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--foreground)" }}>
                                                {p.username?.[0]?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                        <span style={{
                                            flex: 1, fontSize: 13, fontWeight: 600, color: "var(--foreground)",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {p.username}
                                        </span>
                                        <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
                                            {p.points}pts · {p.wins}W-{p.losses}L
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", paddingTop: 12, paddingBottom: 12, fontStyle: "italic" }}>
                                    Sin resultados
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info + count */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {date && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                                    <Clock style={{ width: 12, height: 12 }} /> {date}
                                </span>
                            )}
                            {tournament.city && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <MapPin style={{ width: 12, height: 12 }} /> {tournament.city}
                                </span>
                            )}
                        </div>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                            <Persons style={{ width: 12, height: 12 }} /> {tournament.registered_count ?? tournament.current_players ?? 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
