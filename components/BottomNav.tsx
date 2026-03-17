"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Medal,
    ShoppingCart,
    Comment,
    Person,
} from "@gravity-ui/icons";

import { useAuth } from "@/context/AuthContext";

const tabs = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Medal },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
    { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
    { href: "/perfil/me", label: "Perfil", icon: Person },
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
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around rounded-t-3xl"
            style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                backdropFilter: "blur(32px) saturate(1.5)",
                WebkitBackdropFilter: "blur(32px) saturate(1.5)",
                boxShadow: "0 -2px 20px rgba(0,0,0,0.06)",
            }}
        >
                {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center justify-center gap-0.5 py-3 px-3 min-w-[56px] min-h-[44px] transition-colors relative"
                            style={{
                                color: active
                                    ? "var(--accent)"
                                    : "var(--muted)",
                            }}
                        >
                            {/* Active indicator dot */}
                            {active && (
                                <span
                                    className="absolute top-1.5 w-1 h-1 rounded-full transition-all duration-300"
                                    style={{ background: "var(--accent)" }}
                                />
                            )}
                            <Icon
                                className="size-6 transition-all duration-200"
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
                                    fontSize: "11px",
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
