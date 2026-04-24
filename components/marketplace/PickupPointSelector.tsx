"use client";

import { Chip } from "@heroui/react/chip";
import { Spinner } from "@heroui/react/spinner";
import { TriangleExclamation } from "@gravity-ui/icons";
import type { PickupPoint } from "@/lib/types/marketplace-v2";

export interface PickupPointSelectorProps {
    points: PickupPoint[];
    value?: string;
    onChange: (pickupPointId: string) => void;
    isLoading?: boolean;
    isError?: boolean;
}

function statusLabel(status: PickupPoint["status"]): string {
    switch (status) {
        case "ACTIVE":
            return "Disponible";
        case "COMING_SOON":
            return "Proximamente";
        default:
            return "No disponible";
    }
}

export default function PickupPointSelector({
    points,
    value,
    onChange,
    isLoading,
    isError,
}: PickupPointSelectorProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner size="md" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-muted">
                <TriangleExclamation className="h-4 w-4 shrink-0" />
                <span>No pudimos cargar los puntos de retiro. Intenta nuevamente en unos minutos.</span>
            </div>
        );
    }

    if (points.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
                Aun no hay puntos de retiro configurados.
            </div>
        );
    }

    return (
        <div role="radiogroup" aria-label="Selecciona un punto de retiro" className="flex flex-col gap-2">
            {points.map((p) => {
                const disabled = p.status !== "ACTIVE";
                const selected = !disabled && value === p.id;
                return (
                    <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-disabled={disabled}
                        disabled={disabled}
                        title={
                            p.status === "COMING_SOON"
                                ? "Este punto estara disponible proximamente"
                                : p.status === "INACTIVE"
                                  ? "Este punto no esta disponible"
                                  : undefined
                        }
                        onClick={() => { if (!disabled) onChange(p.id); }}
                        className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            selected
                                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                                : disabled
                                  ? "cursor-not-allowed border-border bg-surface/60 opacity-60"
                                  : "border-border bg-surface hover:border-[var(--accent)]/60"
                        }`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                            {(p.address || p.city) && (
                                <p className="mt-0.5 text-xs text-muted truncate">
                                    {[p.address, p.city, p.region].filter(Boolean).join(", ")}
                                </p>
                            )}
                            {p.opening_hours && (
                                <p className="mt-0.5 text-[11px] text-muted truncate">{p.opening_hours}</p>
                            )}
                        </div>
                        <Chip
                            size="sm"
                            variant="soft"
                            color={p.status === "ACTIVE" ? "success" : p.status === "COMING_SOON" ? "warning" : "default"}
                        >
                            {statusLabel(p.status)}
                        </Chip>
                    </button>
                );
            })}
        </div>
    );
}
