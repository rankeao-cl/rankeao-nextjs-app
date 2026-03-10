"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Button } from "@heroui/react";

interface Props {
    initialQuery?: string;
}

export default function MarketplaceSearch({ initialQuery = "" }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);

    const handleSearch = useCallback((e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());

        if (query.trim()) {
            params.set("q", query.trim());
        } else {
            params.delete("q");
        }

        // Reset to page 1 on new search
        params.delete("page");

        router.push(`${pathname}?${params.toString()}`);
    }, [query, router, pathname, searchParams]);

    return (
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar carta, juego o tienda..."
                className="flex-1 bg-[var(--surface-secondary)] border border-[var(--border)] shadow-none text-white px-3 py-2 rounded-xl"
            />
            <Button
                type="submit"
                className="font-bold border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]"
            >
                Buscar
            </Button>
        </form>
    );
}
