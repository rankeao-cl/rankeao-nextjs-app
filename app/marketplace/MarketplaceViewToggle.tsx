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

    const setView = useCallback(
        (view: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (view === "grid") {
                params.delete("view");
            } else {
                params.set("view", view);
            }
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
            <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                    currentView !== "list"
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                title="Vista cuadrícula"
                aria-label="Vista cuadrícula"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
                    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
                    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
                    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
                </svg>
            </button>
            <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${
                    currentView === "list"
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                title="Vista lista"
                aria-label="Vista lista"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="14" height="4" rx="1" fill="currentColor" />
                    <rect x="1" y="6" width="14" height="4" rx="1" fill="currentColor" />
                    <rect x="1" y="11" width="14" height="4" rx="1" fill="currentColor" />
                </svg>
            </button>
        </div>
    );
}
