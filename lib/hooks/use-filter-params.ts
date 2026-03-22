"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Shared hook for URL-based filter management.
 * Extracts the duplicated updateFilter/clearFilters pattern used across filter pages.
 */
export function useFilterParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateFilter = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            if (key !== "page") params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams],
    );

    const clearFilters = useCallback(() => {
        router.push(pathname);
    }, [router, pathname]);

    return { searchParams, updateFilter, clearFilters };
}
