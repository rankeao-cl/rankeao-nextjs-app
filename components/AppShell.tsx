"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";
import CreatePostModal from "./CreatePostModal";
import CreatePostFAB from "./CreatePostFAB";

const SwipeWrapper = dynamic(() => import("./SwipeWrapper"), {
    ssr: false,
    loading: () => null,
});
const PullToRefresh = dynamic(() => import("./PullToRefresh"), {
    ssr: false,
    loading: () => null,
});

const fullWidthPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/terminos", "/privacidad", "/cookies"];
const fixedLayoutPages = ["/chat"];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isFullWidth = fullWidthPages.some((p) => pathname.startsWith(p));
    const isFixedLayout = fixedLayoutPages.some((p) => pathname.startsWith(p));

    if (isFullWidth) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
            <Sidebar collapsed={sidebarCollapsed} />

            {/* Sidebar collapse toggle — floating between sidebar and body */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex"
                style={{
                    position: "absolute",
                    left: sidebarCollapsed ? 56 : 208,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 30,
                    width: 24,
                    height: 48,
                    borderRadius: "0 8px 8px 0",
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderLeft: "none",
                    cursor: "pointer",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "left 0.3s",
                }}
                aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
                <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transition: "transform 0.3s",
                        transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                    }}
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>

            {isFixedLayout ? (
                <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-hidden">
                    {children}
                </main>
            ) : (
                <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-y-auto overflow-x-hidden">
                    <PullToRefresh>
                        <SwipeWrapper>
                            {children}
                        </SwipeWrapper>
                    </PullToRefresh>
                </main>
            )}

            <RightSidebar />

            <BottomNav />

            <CreatePostModal />
            <CreatePostFAB />
        </div>
    );
}
