"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShoppingCart,
    Tag,
    CreditCard,
    Person,
    ChevronDown,
} from "@gravity-ui/icons";

interface AccountNavItem {
    href: string;
    label: string;
    icon: typeof Person;
}

const ACCOUNT_NAV: AccountNavItem[] = [
    { href: "/mi-cuenta/compras", label: "Mis compras", icon: ShoppingCart },
    { href: "/mi-cuenta/ventas", label: "Mis ventas", icon: Tag },
    { href: "/mi-cuenta/billetera", label: "Mi billetera", icon: CreditCard },
    { href: "/mi-cuenta/perfil", label: "Mi perfil", icon: Person },
];

function isItemActive(pathname: string, href: string) {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
}

function AccountNavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    return (
        <nav aria-label="Navegacion de mi cuenta" className="flex flex-col gap-1">
            {ACCOUNT_NAV.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                            active
                                ? "text-foreground bg-surface-solid border border-border"
                                : "text-muted hover:text-foreground hover:bg-surface-solid/60 border border-transparent"
                        }`}
                    >
                        <Icon className="size-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function AccountSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentLabel =
        ACCOUNT_NAV.find((item) => isItemActive(pathname, item.href))?.label ?? "Mi cuenta";

    return (
        <>
            {/* Desktop: sidebar fijo a la izquierda del contenido */}
            <aside
                aria-label="Menu de mi cuenta"
                className="hidden lg:block w-[240px] shrink-0 sticky top-4 self-start"
            >
                <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="px-3 pt-1 pb-2 text-[11px] uppercase tracking-wider font-bold text-muted">
                        Mi cuenta
                    </p>
                    <AccountNavList pathname={pathname} />
                </div>
            </aside>

            {/* Mobile/tablet: selector colapsable arriba del contenido */}
            <div className="lg:hidden mb-4">
                <button
                    type="button"
                    aria-expanded={mobileOpen}
                    aria-controls="account-mobile-nav"
                    onClick={() => setMobileOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground"
                >
                    <span className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted">
                            Mi cuenta
                        </span>
                        <span>/</span>
                        <span>{currentLabel}</span>
                    </span>
                    <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {mobileOpen && (
                    <div
                        id="account-mobile-nav"
                        className="mt-2 rounded-xl border border-border bg-background p-2"
                    >
                        <AccountNavList
                            pathname={pathname}
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
