import { getDuel } from "@/lib/api/duels";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { Duel, DuelStatus } from "@/lib/types/duel";
import DuelActions from "./DuelActions";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    let duel: Duel | null = null;
    try {
        const res = await getDuel(id).catch(() => null);
        duel = res?.duel ?? null;
    } catch { /* silent */ }
    const title = duel
        ? `${duel.challenger.username} vs ${duel.opponent.username}`
        : "Duelo";
    return { title, description: `Detalle del duelo en Rankeao.` };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#F59E0B",
    ACCEPTED: "#3B82F6",
    IN_PROGRESS: "#22C55E",
    COMPLETED: "#6B7280",
    DECLINED: "#EF4444",
    CANCELLED: "#6B7280",
    DISPUTED: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptado",
    IN_PROGRESS: "En curso",
    COMPLETED: "Finalizado",
    DECLINED: "Rechazado",
    CANCELLED: "Cancelado",
    DISPUTED: "Disputado",
};

function PlayerCard({ player, wins, isWinner }: { player: Duel["challenger"]; wins?: number; isWinner: boolean }) {
    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: 20,
            borderRadius: 16,
            border: isWinner ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.06)",
            backgroundColor: isWinner ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
        }}>
            {player.avatar_url ? (
                <Image src={player.avatar_url} alt={player.username} width={56} height={56} style={{ borderRadius: 999, objectFit: "cover" }} />
            ) : (
                <div style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#888891" }}>
                        {player.username.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F2F2F2", margin: 0 }}>
                    {player.display_name || player.username}
                </p>
                <p style={{ fontSize: 11, color: "#888891", margin: 0, marginTop: 2 }}>@{player.username}</p>
            </div>
            {wins != null && (
                <span style={{ fontSize: 28, fontWeight: 800, color: isWinner ? "#22C55E" : "#F2F2F2" }}>
                    {wins}
                </span>
            )}
            {isWinner && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 999 }}>
                    GANADOR
                </span>
            )}
        </div>
    );
}

export default async function DuelDetailPage({ params }: Props) {
    const { id } = await params;
    let duel: Duel | null = null;
    try {
        const res = await getDuel(id).catch(() => null);
        duel = res?.duel ?? null;
    } catch { /* silent */ }

    if (!duel) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-lg font-medium text-[#F2F2F2]">Duelo no encontrado</p>
                <Link href="/duelos" style={{ marginTop: 16, color: "#3B82F6", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Volver a duelos
                </Link>
            </div>
        );
    }

    const sColor = STATUS_COLORS[duel.status] ?? "#888891";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const isActive = ["ACCEPTED", "IN_PROGRESS"].includes(duel.status);

    const challengerIsWinner = duel.winner_id === duel.challenger.id;
    const opponentIsWinner = duel.winner_id === duel.opponent.id;

    const createdDate = duel.created_at
        ? new Date(duel.created_at).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : null;

    return (
        <div className="max-w-3xl mx-auto flex flex-col px-4 lg:px-6 py-6">
            {/* Back link */}
            <Link href="/duelos" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#888891", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Volver a duelos
            </Link>

            {/* Header card */}
            <div style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 16,
            }}>
                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, backgroundColor: sColor + "18" }}>
                        {isActive && (
                            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
                        )}
                        <span style={{ fontSize: 11, fontWeight: 700, color: sColor }}>{sLabel}</span>
                    </span>
                    {createdDate && (
                        <span style={{ fontSize: 11, color: "#888891" }}>{createdDate}</span>
                    )}
                </div>

                {/* Players */}
                <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                    <PlayerCard player={duel.challenger} wins={duel.challenger_wins} isWinner={challengerIsWinner} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#888891" }}>VS</span>
                    </div>
                    <PlayerCard player={duel.opponent} wins={duel.opponent_wins} isWinner={opponentIsWinner} />
                </div>
            </div>

            {/* Info card */}
            <div style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
            }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F2F2F2", margin: 0, marginBottom: 14 }}>Detalles</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {duel.game_name && (
                        <span style={{ fontSize: 12, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            🎮 {duel.game_name}
                        </span>
                    )}
                    {duel.format_name && (
                        <span style={{ fontSize: 12, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 10 }}>
                            {duel.format_name}
                        </span>
                    )}
                    <span style={{ fontSize: 12, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 10 }}>
                        Bo{duel.best_of}
                    </span>
                    <span style={{ fontSize: 12, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 10 }}>
                        {duel.is_ranked ? "Ranked" : "Casual"}
                    </span>
                </div>
            </div>

            {/* Actions (client component) */}
            <DuelActions
                duelId={duel.id}
                status={duel.status as DuelStatus}
                bestOf={duel.best_of}
                hasWinner={!!duel.winner_id}
            />
        </div>
    );
}
