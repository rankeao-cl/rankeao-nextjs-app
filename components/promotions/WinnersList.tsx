import type { Winner } from "@/lib/types/promotions";
import ChapitaHash from "./ChapitaHash";

function formatDateTime(value: string | undefined): string {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

function sourceLabel(source: Winner["source"]): string {
    if (source === "CHAPITA_PURCHASE") return "Chapita";
    if (source === "FREE_FORM") return "Sin compra";
    return "—";
}

interface WinnersListProps {
    winners: Winner[];
    drawAt?: string;
}

export default function WinnersList({ winners, drawAt }: WinnersListProps) {
    if (!winners.length) {
        return (
            <div className="rounded-xl border border-border bg-background p-6 text-center text-sm text-muted">
                Todavia no hay ganadores publicados.
            </div>
        );
    }

    const sorted = [...winners].sort(
        (a, b) => (a.winner_index ?? 999) - (b.winner_index ?? 999)
    );

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
                <h3 className="text-sm font-bold text-foreground">Ganadores del sorteo</h3>
                {drawAt && (
                    <span className="text-[11px] text-muted">
                        Sorteado el {formatDateTime(drawAt)}
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-surface/30 text-left text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                            <th scope="col" className="px-4 py-2 font-semibold">#</th>
                            <th scope="col" className="px-4 py-2 font-semibold">Ganador</th>
                            <th scope="col" className="px-4 py-2 font-semibold">Origen</th>
                            <th scope="col" className="px-4 py-2 font-semibold">Serial</th>
                            <th scope="col" className="px-4 py-2 font-semibold">Hash</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.map((w, idx) => {
                            const name =
                                w.display_name ??
                                w.username ??
                                w.full_name ??
                                "Participante";
                            return (
                                <tr key={w.id ?? `${w.winner_index ?? idx}-${w.chapita_hash ?? idx}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-muted">
                                        {w.winner_index != null ? `#${w.winner_index + 1}` : `#${idx + 1}`}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-foreground">
                                        {name}
                                    </td>
                                    <td className="px-4 py-3 text-muted">
                                        {sourceLabel(w.source)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                                        {w.serial_number != null ? `#${w.serial_number}` : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {w.chapita_hash ? (
                                            <ChapitaHash hash={w.chapita_hash} />
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {sorted.some((w) => w.seed || w.salt_revealed) && (
                <div className="border-t border-border bg-surface/30 px-4 py-3 text-[11px] text-muted">
                    <p>
                        <strong className="text-foreground">Transparencia del sorteo:</strong>{" "}
                        El seed y el salt revelado son publicos y permiten verificar que el
                        sorteo fue determinista.
                    </p>
                    {sorted[0]?.seed && (
                        <p className="mt-1 font-mono">seed: {sorted[0].seed}</p>
                    )}
                    {sorted[0]?.salt_revealed && (
                        <p className="font-mono">salt: {sorted[0].salt_revealed}</p>
                    )}
                </div>
            )}
        </div>
    );
}
