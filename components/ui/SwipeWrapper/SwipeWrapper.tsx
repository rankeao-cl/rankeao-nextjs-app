"use client";

import { useRef, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SwipeWrapperProps {
    children: ReactNode;
}

const MAIN_ROUTES = ["/", "/torneos", "/duelos", "/marketplace", "/perfil/me"];
const SWIPE_THRESHOLD = 80;

export default function SwipeWrapper({ children }: SwipeWrapperProps) {
    const router = useRouter();
    const pathname = usePathname();
    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        const dt = Date.now() - touchStart.current.time;
        touchStart.current = null;

        // Ignore if vertical scroll or too slow
        if (Math.abs(dy) > Math.abs(dx) || dt > 500) return;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;

        const isMainRoute = MAIN_ROUTES.includes(pathname);
        if (!isMainRoute) return;

        const currentIdx = MAIN_ROUTES.indexOf(pathname);

        if (dx > 0 && currentIdx > 0) {
            router.push(MAIN_ROUTES[currentIdx - 1]);
        } else if (dx < 0 && currentIdx < MAIN_ROUTES.length - 1 && currentIdx !== -1) {
            router.push(MAIN_ROUTES[currentIdx + 1]);
        }
    }, [pathname, router]);

    return (
        <div
            className="w-full min-h-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {children}
        </div>
    );
}
