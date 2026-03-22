"use client";

import type { ReactNode } from "react";
import { useFilterParams } from "@/lib/hooks/use-filter-params";

export interface ViewToggleOption {
    key: string;
    icon: ReactNode;
    ariaLabel: string;
}

interface ViewToggleProps {
    currentView: string;
    options: ViewToggleOption[];
    /** URL param name (default "view"). Only used in URL mode. */
    paramName?: string;
    /** Value that means "default" — deletes the param instead of setting it. */
    defaultView?: string;
    /** Callback mode: if provided, calls this instead of pushing to URL. */
    onChange?: (newView: string) => void;
}

export default function ViewToggle({ currentView, options, paramName = "view", defaultView, onChange }: ViewToggleProps) {
    const { updateFilter } = useFilterParams();
    const fallbackDefault = defaultView ?? options[0]?.key;

    const nextOption = options.find((o) => o.key !== currentView) ?? options[0];

    function toggle() {
        const newView = nextOption.key;
        if (onChange) {
            onChange(newView);
        } else {
            updateFilter(paramName, newView === fallbackDefault ? "" : newView);
        }
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
            aria-label={nextOption.ariaLabel}
        >
            {nextOption.icon}
        </button>
    );
}

// ── Predefined icons ──

export const GRID_ICON = (
    <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
        <rect x="9" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
        <rect x="1" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
        <rect x="9" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
    </svg>
);

export const LIST_ICON = (
    <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="3.5" rx="1" fill="#F2F2F2" />
        <rect x="1" y="6.25" width="14" height="3.5" rx="1" fill="#F2F2F2" />
        <rect x="1" y="11.5" width="14" height="3.5" rx="1" fill="#F2F2F2" />
    </svg>
);

export const CALENDAR_ICON = (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F2F2F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
