"use client";

import { Button } from "@heroui/react";
import { useFilterParams } from "@/lib/hooks/use-filter-params";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    const { updateFilter } = useFilterParams();

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center mt-6 mb-8">
            <div className="flex justify-center py-4 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] gap-4 items-center">
                <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={currentPage <= 1}
                    onPress={() => updateFilter("page", String(currentPage - 1))}
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
                    onPress={() => updateFilter("page", String(currentPage + 1))}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
