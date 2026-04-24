"use client";

import { CircleCheck } from "@gravity-ui/icons";
import type { OrderV2Status } from "@/lib/types/marketplace-v2";

// Secuencia nominal del FSM happy-path.
const STEPS: { key: OrderV2Status; label: string; short: string }[] = [
    { key: "PENDING_PAYMENT", label: "Pago pendiente", short: "Pago" },
    { key: "PAID", label: "Pagado", short: "Pagado" },
    { key: "READY_FOR_PICKUP", label: "Listo para retiro", short: "Listo" },
    { key: "PICKED_UP", label: "Retirado", short: "Retirado" },
    { key: "DELIVERED", label: "Entregado", short: "Entregado" },
    { key: "COMPLETED", label: "Completado", short: "Completado" },
];

function stepIndex(status: string): number {
    const idx = STEPS.findIndex((s) => s.key === status.toUpperCase());
    return idx >= 0 ? idx : 0;
}

export interface OrderTimelineProps {
    status: string;
}

/**
 * Horizontal stepper con línea conectora entre pasos. Cada paso alcanzado
 * (incluyendo el actual) se marca en verde; los pendientes en gris. El
 * segmento de la línea conectora entre dos pasos es verde solo cuando
 * ambos extremos están alcanzados — así la línea visualmente progresa con
 * el estado de la orden.
 *
 * Accesibilidad: <ol> con aria-label + aria-current="step" en el actual.
 */
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
    const isDisputed = upper === "DISPUTED";

    return (
        <div className="w-full">
            <ol
                className="relative flex items-start justify-between gap-2"
                aria-label="Estado del pedido"
            >
                {STEPS.map((step, idx) => {
                    const reached = idx <= current;
                    const isCurrent = idx === current;
                    const isLast = idx === STEPS.length - 1;
                    const nextReached = idx + 1 <= current;

                    return (
                        <li
                            key={step.key}
                            className="relative flex min-w-0 flex-1 flex-col items-center"
                            aria-current={isCurrent ? "step" : undefined}
                        >
                            {/* Connector line to next step — anchored to the circle's vertical center */}
                            {!isLast && (
                                <span
                                    aria-hidden
                                    className={`absolute left-1/2 top-[11px] h-[2px] w-full -z-0 ${
                                        nextReached && reached
                                            ? "bg-[var(--success,#22c55e)]"
                                            : "bg-border"
                                    }`}
                                />
                            )}

                            {/* Step node */}
                            <span
                                aria-hidden
                                className={`relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors ${
                                    reached
                                        ? "border-[var(--success,#22c55e)] bg-[var(--success,#22c55e)] text-white"
                                        : "border-border bg-background text-muted"
                                } ${isCurrent && !reached ? "" : ""} ${
                                    isCurrent
                                        ? "ring-2 ring-offset-2 ring-[var(--success,#22c55e)]/40 ring-offset-background"
                                        : ""
                                }`}
                            >
                                {reached ? <CircleCheck className="h-3.5 w-3.5" /> : idx + 1}
                            </span>

                            {/* Label */}
                            <span
                                className={`mt-2 text-center text-[11px] leading-tight sm:text-xs ${
                                    isCurrent
                                        ? "font-semibold text-foreground"
                                        : reached
                                          ? "text-foreground"
                                          : "text-muted"
                                }`}
                            >
                                <span className="hidden sm:inline">{step.label}</span>
                                <span className="sm:hidden">{step.short}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>

            {isDisputed && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--danger,#ef4444)]/30 bg-[var(--danger,#ef4444)]/10 px-3 py-2">
                    <span
                        aria-hidden
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--danger,#ef4444)] bg-[var(--danger,#ef4444)]/10 text-[11px] font-bold text-[var(--danger,#ef4444)]"
                    >
                        !
                    </span>
                    <span className="text-sm font-semibold text-[var(--danger,#ef4444)]">
                        Orden en disputa
                    </span>
                </div>
            )}
        </div>
    );
}
