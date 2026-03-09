"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";

/* Pages that skip the shell layout (show full-width + footer instead) */
const fullWidthPages = ["/login", "/register", "/terminos", "/privacidad", "/cookies"];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = fullWidthPages.some((p) => pathname.startsWith(p));

    /* Full-width pages render without sidebar / bottom nav */
    if (isFullWidth) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Desktop left sidebar */}
            <Sidebar />

            {/* Central content */}
            <main className="flex-1 min-w-0 pb-16 lg:pb-0">
                {children}
            </main>

            {/* Desktop right sidebar */}
            <RightSidebar />

            {/* Mobile bottom nav */}
            <BottomNav />
        </div>
    );
}
