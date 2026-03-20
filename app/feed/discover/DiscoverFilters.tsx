"use client";

import Link from "next/link";

const FILTERS = [
  { key: undefined, label: "Todo" },
  { key: "torneos", label: "Torneos" },
  { key: "ventas", label: "Ventas" },
] as const;

interface Props {
  active?: string;
}

export default function DiscoverFilters({ active }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {FILTERS.map((filter) => {
        const isActive = active === filter.key || (!active && !filter.key);
        const href = filter.key
          ? `/feed/discover?tipo=${filter.key}`
          : "/feed/discover";

        return (
          <Link
            key={filter.key ?? "todo"}
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
