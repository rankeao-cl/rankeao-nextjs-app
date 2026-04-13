"use client";


import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    ShoppingCart,
    Dice1,
} from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";

const tabs = [
    { href: "/", label: "Feed", icon: House },
    { href: "/matches", label: "Partidas", icon: Dice1, authRequired: true },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
];

const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default function BottomNav() {
    const pathname = usePathname();
    const { session, status } = useAuth();
    const isAuth = status === "authenticated";

    const avatarUrl = useAuthStore((s) => s.avatarUrl);

    if (authPages.some((p) => pathname.startsWith(p))) {
        return null;
    }

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const filteredTabs = tabs.filter(
        (tab) => !tab.authRequired || isAuth
    );

    const profileActive = pathname.startsWith("/perfil");
    const initial = session?.username?.[0]?.toUpperCase() || "?";

    return (
        <nav
            aria-label="Navegacion inferior"
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background"
        >
            {/* Hairline divider */}
            <div
                className="h-px w-full bg-border"
            />

            <div className="flex items-center justify-around pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)] px-1">
                {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex-1 flex flex-col items-center justify-center py-1"
                            aria-label={tab.label}
                        >
                            <div className="w-6 h-6 flex items-center justify-center mb-1 relative">
                                <Icon
                                    className={`size-[22px] transition-opacity duration-200 ${active ? "text-foreground" : "text-muted"}`}
                                />
                            </div>
                            <span
                                className="leading-none whitespace-nowrap transition-opacity duration-200 text-[10px] font-semibold tracking-[0.1px] text-foreground"
                                style={{
                                    opacity: active ? 1 : 0.5,
                                }}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}

                {/* Profile tab — avatar with online badge (Discord style) */}
                <Link
                    href="/perfil/me"
                    className="flex-1 flex flex-col items-center justify-center py-1"
                    aria-label="Tu perfil"
                >
                    <div className="relative w-7 h-7 mb-0.5">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 border-2 border-solid ${profileActive ? "border-foreground" : "border-transparent"}`}
                        >
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width={22}
                                    height={22}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center bg-surface-solid"
                                >
                                    <span
                                        className="text-[11px] font-bold text-foreground"
                                    >
                                        {initial}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Online badge */}
                        {isAuth && (
                            <div
                                className="absolute -bottom-px -right-px w-3 h-3 rounded-full flex items-center justify-center bg-background"
                            >
                                <div
                                    className="w-2 h-2 rounded-full bg-success"
                                />
                            </div>
                        )}
                    </div>
                    <span
                        className="leading-none whitespace-nowrap transition-opacity duration-200 text-[10px] font-semibold tracking-[0.1px] text-foreground"
                        style={{
                            opacity: profileActive ? 1 : 0.5,
                        }}
                    >
                        Tu
                    </span>
                </Link>
            </div>
        </nav>
    );
}
