"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

import CreatePostModal from "@/features/social/CreatePostModal";
import CreatePostFAB from "@/features/chat/ChatFAB";

const fullWidthPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/terminos", "/privacidad", "/cookies"];
const fixedLayoutPages = ["/chat"];

class SafeBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: Error, info: ErrorInfo) { console.error("[SafeBoundary]", error, info); }
    render() { return this.state.hasError ? null : this.props.children; }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = fullWidthPages.some((p) => pathname.startsWith(p));
    const isFixedLayout = fixedLayoutPages.some((p) => pathname.startsWith(p));

    if (isFullWidth) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
            <Sidebar />

            {isFixedLayout ? (
                <main className="flex-1 min-w-0 pb-16 lg:pb-0 lg:ml-[72px] overflow-hidden">
                    {children}
                </main>
            ) : (
                <main className="flex-1 min-w-0 pb-16 lg:pb-0 lg:ml-[72px] overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            )}

            <BottomNav />

            <SafeBoundary><CreatePostModal /></SafeBoundary>
            <SafeBoundary><CreatePostFAB /></SafeBoundary>
        </div>
    );
}
