"use client";

import { StarFill, ShieldCheck, ShoppingCart } from "@gravity-ui/icons";

export type UserBadgeType = "premium" | "supporter" | "verified" | "tienda" | "staff" | "moderator";

interface Props {
    type: UserBadgeType;
    size?: "sm" | "md";
}

const BADGE_CONFIG: Record<UserBadgeType, {
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    glowClass: string;
}> = {
    premium: {
        label: "Premium",
        icon: null, // set below with component
        colorClass: "text-yellow-500",
        glowClass: "drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]",
    },
    supporter: {
        label: "Supporter",
        icon: null,
        colorClass: "text-amber-700 dark:text-amber-600",
        glowClass: "",
    },
    verified: {
        label: "Verificado",
        icon: null,
        colorClass: "text-blue-500",
        glowClass: "",
    },
    tienda: {
        label: "Tienda",
        icon: null,
        colorClass: "text-green-500",
        glowClass: "",
    },
    staff: {
        label: "Staff",
        icon: null,
        colorClass: "text-[var(--brand)]",
        glowClass: "",
    },
    moderator: {
        label: "Moderador",
        icon: null,
        colorClass: "text-purple-500",
        glowClass: "",
    },
};

export function UserTypeBadge({ type, size = "sm" }: Props) {
    const config = BADGE_CONFIG[type];
    const iconSize = size === "sm" ? "size-3.5" : "size-4";
    const textSize = size === "sm" ? "text-[10px]" : "text-xs";

    const renderIcon = () => {
        switch (type) {
            case "premium":
                return <StarFill className={iconSize} />;
            case "supporter":
                return <span className={size === "sm" ? "text-xs" : "text-sm"}>☕</span>;
            case "verified":
                return <ShieldCheck className={iconSize} />;
            case "tienda":
                return <ShoppingCart className={iconSize} />;
            case "staff":
                return (
                    <span className="inline-flex items-center gap-0.5">
                        <ShoppingCart className={size === "sm" ? "size-3" : "size-3.5"} />
                        <StarFill className={size === "sm" ? "size-2.5" : "size-3"} />
                    </span>
                );
            case "moderator":
                return <ShieldCheck className={iconSize} />;
            default:
                return null;
        }
    };

    return (
        <span
            className={`inline-flex items-center gap-0.5 ${config.colorClass} ${config.glowClass} shrink-0`}
            title={config.label}
        >
            {renderIcon()}
        </span>
    );
}
