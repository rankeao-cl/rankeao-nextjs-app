"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { useCallback } from "react";

export default function TorneosPagination({ currentPage, totalPages }: { currentPage: number, totalPages: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handlePage = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    return (
        <div className="flex justify-center mt-6 mb-8">
            <div className="flex justify-center py-4 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] gap-4 items-center">
                <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={currentPage <= 1}
                    onPress={() => handlePage(currentPage - 1)}
                >
                    Anterior
                </Button>
                <span className="text-xs font-semibold text-[var(--muted)]">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={currentPage >= totalPages}
                    onPress={() => handlePage(currentPage + 1)}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
