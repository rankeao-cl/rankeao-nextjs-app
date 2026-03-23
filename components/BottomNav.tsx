"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Medal,
    ShoppingCart,
    Comment,
} from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/api/social";

const tabs = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Medal },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
    { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
];

const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default function BottomNav() {
    const pathname = usePathname();
    const { session, status } = useAuth();
    const isAuth = status === "authenticated";

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Fetch user avatar
    useEffect(() => {
        if (!isAuth || !session?.username) return;
        getUserProfile(session.username)
            .then((res: any) => {
                const profile = res?.data ?? res;
                if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
            })
            .catch(() => {});
    }, [isAuth, session?.username]);

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
            className="lg:hidden fixed bottom-0 inset-x-0 z-50"
            style={{ background: "var(--background)" }}
        >
            {/* Hairline divider */}
            <div
                className="h-px w-full"
                style={{ background: "var(--border)" }}
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
                                    className="size-[22px] transition-opacity duration-200"
                                    style={{
                                        color: active
                                            ? "var(--foreground)"
                                            : "var(--muted)",
                                    }}
                                />
                            </div>
                            <span
                                className="leading-none whitespace-nowrap transition-opacity duration-200"
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    letterSpacing: "0.1px",
                                    color: "var(--foreground)",
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
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200"
                            style={{
                                borderWidth: "2px",
                                borderStyle: "solid",
                                borderColor: profileActive
                                    ? "var(--foreground)"
                                    : "transparent",
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="w-[22px] h-[22px] rounded-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                                    style={{ background: "var(--surface-solid)" }}
                                >
                                    <span
                                        className="text-[11px] font-bold"
                                        style={{ color: "var(--foreground)" }}
                                    >
                                        {initial}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Online badge */}
                        {isAuth && (
                            <div
                                className="absolute -bottom-px -right-px w-3 h-3 rounded-full flex items-center justify-center"
                                style={{ background: "var(--background)" }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: "#22C55E" }}
                                />
                            </div>
                        )}
                    </div>
                    <span
                        className="leading-none whitespace-nowrap transition-opacity duration-200"
                        style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            letterSpacing: "0.1px",
                            color: "var(--foreground)",
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
