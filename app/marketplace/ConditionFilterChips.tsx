"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const CONDITION_FILTERS = [
    { label: "Todos", value: "" },
    { label: "Mint", value: "M" },
    { label: "Near Mint", value: "NM" },
    { label: "Excellent", value: "LP" },
    { label: "Good", value: "MP" },
    { label: "Played", value: "HP" },
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent -mx-1 px-1">
            {CONDITION_FILTERS.map((filter) => {
                const isActive = currentCondition === filter.value;
                return (
                    <button
                        key={filter.value || "__all"}
                        onClick={() => handleSelect(filter.value)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            isActive
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
                                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
                        }`}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
