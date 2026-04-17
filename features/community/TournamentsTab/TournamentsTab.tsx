"use client";

import { useTournaments } from "@/lib/hooks/use-tournaments";
import TournamentCard from "@/features/tournament/TournamentCard";

interface Props {
    tenantSlug: string;
}

export default function TournamentsTab({ tenantSlug }: Props) {
    const { data, isLoading } = useTournaments({ tenant_slug: tenantSlug, per_page: 20, sort: "upcoming" });
    const tournaments = data?.tournaments ?? [];

    const now = new Date();
    const upcoming = tournaments.filter((t) => {
        const status = t.status.toUpperCase();
        if (["FINISHED", "CLOSED", "CANCELLED"].includes(status)) return false;
        if (t.starts_at && new Date(t.starts_at) >= now) return true;
        if (["OPEN", "CHECK_IN", "STARTED", "ROUND_IN_PROGRESS", "ROUND_COMPLETE"].includes(status)) return true;
        return false;
    });
    const past = tournaments.filter((t) => {
        const status = t.status.toUpperCase();
        return status === "FINISHED" || status === "CLOSED" || status === "CANCELLED"
            || (t.starts_at && new Date(t.starts_at) < now && !upcoming.includes(t));
    });

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Eventos Oficiales</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-[22px] bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Upcoming */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">Próximos Torneos</h2>
                {upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {upcoming.map((tournament) => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                        <div className="size-12 bg-[var(--surface-tertiary)] rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
                            📅
                        </div>
                        <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Sin eventos próximos</h3>
                        <p className="text-sm text-[var(--muted)] max-w-sm">Mantente atento, pronto anunciarán nuevos torneos.</p>
                    </div>
                )}
            </div>

            {/* Past */}
            {past.length > 0 && (
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">Torneos Pasados</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {past.map((tournament) => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                </div>
            )}

            {tournaments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                    <div className="size-16 bg-[var(--surface-tertiary)] rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                        🏆
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Sin eventos programados</h3>
                    <p className="text-[var(--muted)] max-w-sm">Mantente atento, pronto anunciarán nuevos torneos épicos.</p>
                </div>
            )}
        </div>
    );
}
