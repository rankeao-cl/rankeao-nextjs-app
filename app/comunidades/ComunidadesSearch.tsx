"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Magnifier, MapPin } from "@gravity-ui/icons";

interface Props {
  initialQuery?: string;
  initialCity?: string;
}

export default function ComunidadesSearch({ initialQuery, initialCity }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || "");
  const [city, setCity] = useState(initialCity || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    params.set("page", "1");
    router.push(`/comunidades?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
      <div className="relative flex-1">
        <Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tienda o comunidad..."
          className="w-full h-10 pl-9 pr-3 rounded-xl text-sm bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)]/50 transition-colors"
        />
      </div>
      <div className="relative w-full sm:w-40">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ciudad..."
          className="w-full h-10 pl-9 pr-3 rounded-xl text-sm bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)]/50 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="h-10 px-5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
      >
        Buscar
      </button>
    </form>
  );
}
