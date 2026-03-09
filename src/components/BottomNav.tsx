"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Cup,
    ShoppingCart,
    Comment,
    Person,
} from "@gravity-ui/icons";

const tabs = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Cup },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
    { href: "/chat", label: "Chat", icon: Comment },
    { href: "/perfil", label: "Perfil", icon: Person },
];

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <nav
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t backdrop-blur-xl"
            style={{
                background: "oklch(from var(--surface) l c h / 0.85)",
                borderColor: "var(--border)",
            }}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors ${active
                            ? "text-[var(--accent)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        <Icon className={`size-5 ${active ? "drop-shadow-[0_0_6px_var(--accent)]" : ""}`} />
                        <span
                            className={`text-[10px] font-medium leading-tight ${active ? "font-semibold" : ""
                                }`}
                        >
                            {tab.label}
                        </span>
                        {active && (
                            <div
                                className="absolute top-0 h-[2px] w-8 rounded-b-full"
                                style={{ background: "var(--accent)" }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
