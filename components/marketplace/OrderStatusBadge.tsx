"use client";

import { Chip } from "@heroui/react/chip";
import type { OrderV2Status } from "@/lib/types/marketplace-v2";

// ChipColor es el set de colores soportado por HeroUI Chip en este repo.
// "primary"/"secondary" se mapean a "accent"/"warning" respectivamente para
// compatibilidad con la paleta existente.
type ChipColor = "default" | "warning" | "success" | "danger" | "accent";

interface StatusCfg {
    label: string;
    color: ChipColor;
}

const STATUS_CONFIG: Record<OrderV2Status, StatusCfg> = {
    PENDING_PAYMENT: { label: "Pendiente de pago", color: "default" },
    PAID: { label: "Pagado", color: "accent" },
    READY_FOR_PICKUP: { label: "Listo para retiro", color: "warning" },
    PICKED_UP: { label: "Retirado", color: "warning" },
    DELIVERED: { label: "Entregado", color: "warning" },
    COMPLETED: { label: "Completado", color: "success" },
    DISPUTED: { label: "En disputa", color: "danger" },
    REFUNDED: { label: "Reembolsado", color: "default" },
    CANCELLED: { label: "Cancelado", color: "default" },
};

export function getOrderStatusConfig(status: string): StatusCfg {
    const normalized = (status || "").toUpperCase() as OrderV2Status;
    return STATUS_CONFIG[normalized] ?? STATUS_CONFIG.PENDING_PAYMENT;
}

export interface OrderStatusBadgeProps {
    status: string;
    size?: "sm" | "md";
    className?: string;
}

export default function OrderStatusBadge({ status, size = "sm", className }: OrderStatusBadgeProps) {
    const cfg = getOrderStatusConfig(status);
    return (
        <Chip size={size} variant="soft" color={cfg.color} className={className}>
            {cfg.label}
        </Chip>
    );
}
