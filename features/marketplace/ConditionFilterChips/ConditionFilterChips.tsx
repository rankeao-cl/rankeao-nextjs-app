"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const CONDITION_FILTERS = [
    { label: "Todos", value: "" },
    { label: "Mint", value: "mint" },
    { label: "Near Mint", value: "near_mint" },
    { label: "Excellent", value: "excellent" },
    { label: "Good", value: "good" },
    { label: "Played", value: "played" },
];

interface Props {
    currentCondition?: string;
}

export default function ConditionFilterChips({ currentCondition = "" }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSelect = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("condition", value);
            } else {
                params.delete("condition");
            }
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CONDITION_FILTERS.map((filter) => {
                const isActive = currentCondition === filter.value;
                return (
                    <button
                        key={filter.value || "__all"}
                        onClick={() => handleSelect(filter.value)}
                        className="shrink-0 cursor-pointer"
                        style={{
                            padding: "8px 16px",
                            borderRadius: "999px",
                            fontSize: "13px",
                            fontWeight: 600,
                            border: "1px solid",
                            backgroundColor: isActive ? "var(--foreground)" : "var(--surface-solid)",
                            borderColor: isActive ? "var(--foreground)" : "var(--surface)",
                            color: isActive ? "var(--background)" : "var(--muted)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
