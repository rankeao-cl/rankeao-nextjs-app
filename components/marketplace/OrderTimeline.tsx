"use client";

import { CircleCheck } from "@gravity-ui/icons";
import type { OrderV2Status } from "@/lib/types/marketplace-v2";

// Secuencia nominal del FSM happy-path.
const STEPS: { key: OrderV2Status; label: string }[] = [
    { key: "PENDING_PAYMENT", label: "Pago pendiente" },
    { key: "PAID", label: "Pagado" },
    { key: "READY_FOR_PICKUP", label: "Listo para retiro" },
    { key: "PICKED_UP", label: "Retirado" },
    { key: "DELIVERED", label: "Entregado" },
    { key: "COMPLETED", label: "Completado" },
];

function stepIndex(status: string): number {
    const idx = STEPS.findIndex((s) => s.key === status.toUpperCase());
    return idx >= 0 ? idx : 0;
}

export interface OrderTimelineProps {
    status: string;
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
    const upper = (status || "").toUpperCase();

    // Estados alternos: no mostrar timeline normal
    if (upper === "CANCELLED" || upper === "REFUNDED") {
        return (
            <p className="text-sm text-muted">
                Esta orden fue {upper === "CANCELLED" ? "cancelada" : "reembolsada"} antes de completar el flujo.
            </p>
        );
    }

    const current = stepIndex(upper);

    return (
        <ol className="flex flex-col gap-3" aria-label="Estado del pedido">
            {STEPS.map((step, idx) => {
                const reached = idx <= current;
                const isCurrent = idx === current;
                return (
                    <li key={step.key} className="flex items-center gap-3">
                        <span
                            aria-hidden
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                                reached
                                    ? "border-[var(--success,#22c55e)] bg-[var(--success,#22c55e)]/10 text-[var(--success,#22c55e)]"
                                    : "border-border bg-surface text-muted"
                            }`}
                        >
                            {reached ? <CircleCheck className="h-3.5 w-3.5" /> : idx + 1}
                        </span>
                        <span
                            className={`text-sm ${
                                isCurrent
                                    ? "font-semibold text-foreground"
                                    : reached
                                      ? "text-foreground"
                                      : "text-muted"
                            }`}
                        >
                            {step.label}
                        </span>
                    </li>
                );
            })}
            {upper === "DISPUTED" && (
                <li className="flex items-center gap-3 pt-1">
                    <span
                        aria-hidden
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--danger,#ef4444)] bg-[var(--danger,#ef4444)]/10 text-[11px] font-bold text-[var(--danger,#ef4444)]"
                    >
                        !
                    </span>
                    <span className="text-sm font-semibold text-[var(--danger,#ef4444)]">
                        Orden en disputa
                    </span>
                </li>
            )}
        </ol>
    );
}
