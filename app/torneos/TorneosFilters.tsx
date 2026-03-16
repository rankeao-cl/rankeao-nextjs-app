"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox, Button, Select, ListBox, Input, Accordion } from "@heroui/react";
import { useCallback } from "react";
import type { CatalogGame } from "@/lib/types/catalog";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "OPEN", label: "Abierto" },
  { value: "CHECK_IN", label: "Check-in" },
  { value: "STARTED", label: "Iniciado" },
  { value: "ROUND_IN_PROGRESS", label: "Ronda en curso" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

interface Props {
  games: CatalogGame[];
  currentFilters: Record<string, string | undefined>;
  activeStatus: string;
}

export default function TorneosFilters({ games, currentFilters, activeStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safeGames = Array.isArray(games) ? games : [];

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
    [router, pathname, searchParams]
  );

  const hasActiveFilters = Object.values(currentFilters).some(Boolean);

  const selectedGame = safeGames.find(g => g.slug === currentFilters.game);
  const formats = selectedGame?.formats || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--foreground)]">Filtros</h3>
        {hasActiveFilters && (
          <Button size="sm" variant="danger-soft" onPress={() => router.push(pathname)} className="h-7 text-xs">
            Limpiar
          </Button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Vista</p>
        {[
          { key: "live", label: "En Curso" },
          { key: "upcoming", label: "Próximos" },
          { key: "past", label: "Pasados" },
        ].map((t) => {
          const currentTab = currentFilters.tab || "upcoming";
          const isActive = currentTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", t.key);
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
              }}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <Accordion defaultExpandedKeys={["search", "status", "game"]} className="px-0">
        <Accordion.Item key="search">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Buscar</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <Input
                placeholder="Buscar torneos..."
                defaultValue={currentFilters.q || ""}
                onChange={(e) => updateFilter("q", e.target.value)}
                className="w-full mt-1"
              />
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="status">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Estado</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                {statusOptions.map((opt) => {
                  const id = opt.value || "__all";
                  const isActive = (currentFilters.status || activeStatus || "__all") === id ||
                    (currentFilters.status === undefined && activeStatus === opt.value);
                  return (
                    <button
                      key={id}
                      onClick={() => updateFilter("status", opt.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                        ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                        : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="game">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Juego</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => updateFilter("game", "")}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${!currentFilters.game
                    ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                    : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                  Todos los juegos
                </button>
                {safeGames.map((g) => {
                  const isActive = currentFilters.game === g.slug;
                  return (
                    <button
                      key={g.slug}
                      onClick={() => updateFilter("game", g.slug)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                        ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                        : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        {formats.length > 0 && (
          <Accordion.Item key="format">
            <Accordion.Heading>
              <Accordion.Trigger>
                <span className="text-sm font-semibold">Formato</span>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => updateFilter("format", "")}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${!currentFilters.format
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                      : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                  >
                    Todos los formatos
                  </button>
                  {formats.map((f) => {
                    const isActive = currentFilters.format === f.slug;
                    return (
                      <button
                        key={f.slug}
                        onClick={() => updateFilter("format", f.slug)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                          : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        )}

        <Accordion.Item key="location">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Ubicación</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <Input
                placeholder="Ciudad"
                defaultValue={currentFilters.city || ""}
                onChange={(e) => updateFilter("city", e.target.value)}
                className="w-full mt-1"
              />
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="dates">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Fechas</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                <Input
                  type="date"
                  placeholder="Desde"
                  defaultValue={currentFilters.date_from || ""}
                  onChange={(e) => updateFilter("date_from", e.target.value)}
                  className="w-full"
                  style={{
                    background: "var(--field-background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--field-foreground)",
                    colorScheme: "dark"
                  }}
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  defaultValue={currentFilters.date_to || ""}
                  onChange={(e) => updateFilter("date_to", e.target.value)}
                  className="w-full"
                  style={{
                    background: "var(--field-background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--field-foreground)",
                    colorScheme: "dark"
                  }}
                />
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="options">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Opciones</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="mt-2">
                <Checkbox
                  isSelected={currentFilters.is_ranked === "true"}
                  onChange={(checked) => updateFilter("is_ranked", checked ? "true" : "")}
                  className="text-sm"
                >
                  Solo Ranked
                </Checkbox>
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
