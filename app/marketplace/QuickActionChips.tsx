"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tag, Receipt, ShoppingBag } from "@gravity-ui/icons";

const actions = [
    { label: "Mis Ofertas", href: "/marketplace?tab=ofertas", icon: Tag },
    { label: "Mis Órdenes", href: "/marketplace?tab=ordenes", icon: Receipt },
    { label: "Mi Tienda", href: "/marketplace?tab=tienda", icon: ShoppingBag },
];

export default function QuickActionChips() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "";

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action) => {
                const tabValue = new URL(action.href, "http://x").searchParams.get("tab") || "";
                const isActive = currentTab === tabValue;
                const Icon = action.icon;
                return (
                    <Link
                        key={action.label}
                        href={action.href}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            isActive
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
                                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
                        }`}
                    >
                        <Icon className="size-3.5" />
                        {action.label}
                    </Link>
                );
            })}
        </div>
    );
}
