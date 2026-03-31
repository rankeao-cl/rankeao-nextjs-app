"use client";

import Link from "next/link";
import { Tag, Receipt, ShoppingBag } from "@gravity-ui/icons";

const actions = [
    { label: "Ofertas", href: "/marketplace?tab=ofertas", icon: Tag },
    { label: "Ordenes", href: "/marketplace/orders", icon: Receipt },
    { label: "Mi Tienda", href: "/marketplace/seller-setup", icon: ShoppingBag },
];

export default function QuickActionChips() {
    return (
        <>
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex-1 flex items-center justify-center gap-1 cursor-pointer"
                        style={{
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            padding: "8px 0",
                            color: "var(--accent)",
                            fontSize: "11px",
                            fontWeight: 600,
                        }}
                    >
                        <Icon className="size-4" />
                        {action.label}
                    </Link>
                );
            })}
        </>
    );
}
