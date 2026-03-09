"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox, Button, Select, ListBox, Input } from "@heroui/react";
import { useCallback } from "react";
import type { CatalogGame } from "@/lib/api";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "OPEN", label: "Abierto" },
  { value: "CHECK_IN", label: "Check-in" },
  { value: "ROUND_IN_PROGRESS", label: "En curso" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CLOSED", label: "Cerrado" },
];

interface Props {
  games: CatalogGame[];
  currentFilters: Record<string, string | undefined>;
  totalPages: number;
  currentPage: number;
}

export default function TorneosFilters({ games, currentFilters, totalPages, currentPage }: Props) {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Buscar torneos..."
          defaultValue={currentFilters.q || ""}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="w-full"
          style={{
            background: "var(--field-background)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            color: "var(--field-foreground)",
          }}
        />

        <Select
          selectedKey={currentFilters.status || "__all"}
          onSelectionChange={(key) =>
            updateFilter("status", String(key) === "__all" ? "" : String(key ?? ""))
          }
          placeholder="Estado"
          className="w-full"
        >
          <Select.Trigger
            className="min-h-10 text-sm rounded-xl"
            style={{ background: "var(--field-background)", border: "1px solid var(--border)" }}
          />
          <Select.Popover>
            <ListBox>
              {statusOptions.map((opt) => {
                const id = opt.value || "__all";
                return (
                  <ListBox.Item key={id} id={id} textValue={opt.label}>
                    {opt.label}
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={currentFilters.game || "__all"}
          onSelectionChange={(key) =>
            updateFilter("game", String(key) === "__all" ? "" : String(key ?? ""))
          }
          placeholder="Juego"
          className="w-full"
        >
          <Select.Trigger
            className="min-h-10 text-sm rounded-xl"
            style={{ background: "var(--field-background)", border: "1px solid var(--border)" }}
          />
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="__all" textValue="Todos los juegos">
                Todos los juegos
              </ListBox.Item>
              {safeGames.map((g) => (
                <ListBox.Item key={g.slug} id={g.slug} textValue={g.name}>
                  {g.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Input
          placeholder="Ciudad"
          defaultValue={currentFilters.city || ""}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="w-full"
          style={{
            background: "var(--field-background)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            color: "var(--field-foreground)",
          }}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Checkbox
          isSelected={currentFilters.is_ranked === "true"}
          onChange={(checked) => updateFilter("is_ranked", checked ? "true" : "")}
          className="text-sm"
        >
          Solo Ranked ⭐
        </Checkbox>

        {Object.values(currentFilters).some(Boolean) && (
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => router.push(pathname)}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              isDisabled={currentPage <= 1}
              onPress={() => updateFilter("page", String(currentPage - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {currentPage} / {totalPages}
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
      )}
    </div>
  );
}
