"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Select, ListBox } from "@heroui/react";

const conditionOptions = [
  { value: "", label: "Todas las condiciones" },
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Light Played" },
  { value: "MP", label: "Moderate Played" },
  { value: "HP", label: "Heavy Played" },
  { value: "DMG", label: "Damaged" },
];

const sortOptions = [
  { value: "newest", label: "Mas recientes" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
];

interface Props {
  currentFilters: Record<string, string | undefined>;
  totalPages: number;
  currentPage: number;
}

export default function MarketplaceFilters({ currentFilters, totalPages, currentPage }: Props) {
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
      if (key !== "page") {
        params.set("page", "1");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          placeholder="Buscar carta, juego o tienda..."
          defaultValue={currentFilters.q || ""}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="w-full rounded-xl border border-purple-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Select
          selectedKey={currentFilters.condition || "__all"}
          onSelectionChange={(key) =>
            updateFilter("condition", String(key) === "__all" ? "" : String(key ?? ""))
          }
          placeholder="Condicion"
          className="w-full"
        >
          <Select.Trigger className="bg-black/30 border border-purple-500/25 rounded-xl min-h-10 text-sm" />
          <Select.Popover>
            <ListBox>
              {conditionOptions.map((opt) => {
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

        <Input
          placeholder="Precio minimo"
          defaultValue={currentFilters.min_price || ""}
          onChange={(e) => updateFilter("min_price", e.target.value.replace(/[^\d]/g, ""))}
          className="w-full rounded-xl border border-purple-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Input
          placeholder="Precio maximo"
          defaultValue={currentFilters.max_price || ""}
          onChange={(e) => updateFilter("max_price", e.target.value.replace(/[^\d]/g, ""))}
          className="w-full rounded-xl border border-purple-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Select
          selectedKey={currentFilters.sort || "newest"}
          onSelectionChange={(key) => updateFilter("sort", String(key ?? "newest"))}
          placeholder="Ordenar"
          className="w-full"
        >
          <Select.Trigger className="bg-black/30 border border-purple-500/25 rounded-xl min-h-10 text-sm" />
          <Select.Popover>
            <ListBox>
              {sortOptions.map((opt) => (
                <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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
            <span className="text-sm text-gray-400">
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
