"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
    currentView: string;
}

export default function MarketplaceViewToggle({ currentView }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const toggle = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentView === "list") {
            params.delete("view");
        } else {
            params.set("view", "list");
        }
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams, currentView]);

    return (
        <button
            onClick={toggle}
            className="shrink-0 flex items-center justify-center cursor-pointer"
            style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 8,
            }}
            aria-label={currentView === "list" ? "Vista cuadrícula" : "Vista lista"}
        >
            {currentView === "list" ? (
                /* Grid icon */
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
                    <rect x="9" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
                    <rect x="1" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
                    <rect x="9" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
                </svg>
            ) : (
                /* List icon */
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="14" height="3.5" rx="1" fill="#F2F2F2" />
                    <rect x="1" y="6.25" width="14" height="3.5" rx="1" fill="#F2F2F2" />
                    <rect x="1" y="11.5" width="14" height="3.5" rx="1" fill="#F2F2F2" />
                </svg>
            )}
        </button>
    );
}
