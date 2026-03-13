"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";
import SwipeWrapper from "./SwipeWrapper";
import PullToRefresh from "./PullToRefresh";

const fullWidthPages = ["/login", "/register", "/terminos", "/privacidad", "/cookies"];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = fullWidthPages.some((p) => pathname.startsWith(p));

    if (isFullWidth) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-x-hidden">
                <PullToRefresh>
                    <SwipeWrapper>
                        {children}
                    </SwipeWrapper>
                </PullToRefresh>
            </main>

            <RightSidebar />

            <BottomNav />
        </div>
    );
}
