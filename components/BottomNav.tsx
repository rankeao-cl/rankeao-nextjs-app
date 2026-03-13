"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Medal,
    ShoppingBag,
    Bell,
    Person,
} from "@gravity-ui/icons";

import { useAuth } from "@/context/AuthContext";

const tabs = [
    { href: "/", label: "Home", icon: House },
    { href: "/torneos", label: "Torneos", icon: Medal },
    { href: "/comunidades", label: "Comunidades", icon: ShoppingBag },
    { href: "/notificaciones", label: "Notificaciones", icon: Bell, authRequired: true },
    { href: "/perfil/me", label: "Perfil", icon: Person, },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { status } = useAuth();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const filteredTabs = tabs.filter(tab =>
        !tab.authRequired || status === "authenticated"
    );

    return (
        <nav
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around rounded-t-2xl"
            style={{
                background: "oklch(from var(--surface) l c h / 0.92)",
                borderTop: "1px solid oklch(from var(--border) l c h / 0.5)",
                backdropFilter: "blur(20px) saturate(1.4)",
                WebkitBackdropFilter: "blur(20px) saturate(1.4)",
                boxShadow: "0 -2px 20px oklch(0% 0 0 / 0.06)",
            }}
        >
                {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 min-w-[52px] transition-colors relative"
                            style={{
                                color: active
                                    ? "var(--accent)"
                                    : "var(--muted)",
                            }}
                        >
                            <Icon
                                className="size-[22px] transition-all duration-200"
                                style={
                                    active
                                        ? {
                                              filter: "drop-shadow(0 0 6px oklch(from var(--accent) l c h / 0.45))",
                                          }
                                        : undefined
                                }
                            />
                            <span
                                className="leading-tight whitespace-nowrap"
                                style={{
                                    fontSize: "10px",
                                    fontWeight: active ? 600 : 500,
                                }}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
        </nav>
    );
}
