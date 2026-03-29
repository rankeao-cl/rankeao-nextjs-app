"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * GitHub-style top loading bar.
 * Appears on route changes, animates from 0→90% while loading,
 * then snaps to 100% and fades out when done.
 */
export default function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const prevUrl = useRef("");

    useEffect(() => {
        const url = pathname + searchParams.toString();

        // Skip initial mount
        if (!prevUrl.current) {
            prevUrl.current = url;
            return;
        }

        // Same URL — no navigation
        if (url === prevUrl.current) return;
        prevUrl.current = url;

        // Navigation completed — finish the bar
        setProgress(100);
        clearInterval(timerRef.current);

        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => setProgress(0), 300);
        }, 200);

        return () => clearTimeout(hideTimer);
    }, [pathname, searchParams]);

    // Listen for clicks on links to START the bar
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") return;

            // Start progress
            setProgress(15);
            setVisible(true);
            clearInterval(timerRef.current);

            // Slowly increment to 90%
            timerRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(timerRef.current);
                        return 90;
                    }
                    return prev + (90 - prev) * 0.1;
                });
            }, 200);
        };

        document.addEventListener("click", handleClick, true);
        return () => {
            document.removeEventListener("click", handleClick, true);
            clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 99999,
                pointerEvents: "none",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.3s ease",
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "var(--foreground)",
                    boxShadow: "0 0 8px var(--foreground)",
                    transition: progress === 0 ? "none" : progress === 100 ? "width 0.15s ease-out" : "width 0.4s ease",
                    borderRadius: "0 2px 2px 0",
                }}
            />
        </div>
    );
}
