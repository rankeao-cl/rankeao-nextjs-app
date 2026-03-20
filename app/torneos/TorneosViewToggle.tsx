"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface TorneosViewToggleProps {
    currentView: "list" | "calendar";
}

export default function TorneosViewToggle({ currentView }: TorneosViewToggleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function toggle() {
        const params = new URLSearchParams(searchParams.toString());
        if (currentView === "list") {
            params.set("view", "calendar");
        } else {
            params.delete("view");
        }
        router.push(`${pathname}?${params.toString()}`);
    }

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
            aria-label={currentView === "list" ? "Vista calendario" : "Vista lista"}
        >
            {currentView === "list" ? (
                /* Calendar icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2F2F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
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
