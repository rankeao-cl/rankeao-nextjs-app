"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";

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
    const isFullWidth = fullWidthPages.some((p) => pathname.startsWith(p));
    const isFixedLayout = fixedLayoutPages.some((p) => pathname.startsWith(p));

    if (isFullWidth) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            <Sidebar />
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
        </div>
    );
}
