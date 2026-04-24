import Image from "next/image";
import Link from "next/link";
import type { Promotion } from "@/lib/types/promotions";

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "Fecha por confirmar";
    try {
        return new Date(dateStr).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return "Fecha por confirmar";
    }
}

function formatCLP(amount: number | undefined): string {
    if (amount == null) return "—";
    return amount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

function statusLabel(status: Promotion["status"]): { text: string; className: string } {
    switch (status) {
        case "ACTIVE":
            return { text: "Activa", className: "bg-emerald-500/15 text-emerald-500" };
        case "SALES_CLOSED":
            return { text: "Ventas cerradas", className: "bg-amber-500/15 text-amber-500" };
        case "DRAWN":
            return { text: "Sorteada", className: "bg-blue-500/15 text-blue-500" };
        case "DELIVERED":
            return { text: "Entregada", className: "bg-purple-500/15 text-purple-500" };
        case "CANCELLED":
            return { text: "Cancelada", className: "bg-red-500/15 text-red-500" };
        default:
            return { text: "Proximamente", className: "bg-surface text-muted" };
    }
}

interface PromotionCardProps {
    promotion: Promotion;
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
    const img = promotion.art_url ?? promotion.image_url;
    const status = statusLabel(promotion.status);
    const remaining =
        promotion.edition_size != null && promotion.minted_count != null
            ? Math.max(0, promotion.edition_size - promotion.minted_count)
            : null;

    return (
        <Link
            href={`/promociones/${promotion.slug}`}
            aria-label={`Ver promocion ${promotion.title}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-[var(--accent)]"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                {img ? (
                    <Image
                        src={img}
                        alt={promotion.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-muted">
                        🎟️
                    </div>
                )}
                <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                >
                    {status.text}
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-base font-bold text-foreground line-clamp-2">
                    {promotion.title}
                </h3>

                {promotion.prize && (
                    <p className="text-xs text-muted line-clamp-2">
                        <span className="font-semibold text-foreground">Premio: </span>
                        {promotion.prize}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted">
                            Sorteo
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatDate(promotion.draw_at)}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-muted">
                            Chapita
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatCLP(promotion.price)}
                        </span>
                    </div>
                </div>

                {remaining != null && (
                    <p className="text-[11px] text-muted">
                        {remaining > 0
                            ? `${remaining.toLocaleString("es-CL")} chapitas disponibles`
                            : "Edicion agotada"}
                    </p>
                )}
            </div>
        </Link>
    );
}
