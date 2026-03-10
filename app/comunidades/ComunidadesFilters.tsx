"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Select, ListBox } from "@heroui/react";

const ratingOptions = [
  { value: "", label: "Cualquier rating" },
  { value: "3", label: "3.0+" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" },
];

const sortOptions = [
  { value: "rating-desc", label: "Mejor valoradas" },
  { value: "newest", label: "Mas nuevas" },
  { value: "name-asc", label: "Nombre A-Z" },
];

interface Props {
  currentFilters: Record<string, string | undefined>;
  totalPages: number;
  currentPage: number;
}

export default function ComunidadesFilters({ currentFilters, totalPages, currentPage }: Props) {
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
          placeholder="Buscar tienda o comunidad..."
          defaultValue={currentFilters.q || ""}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="w-full rounded-xl border border-zinc-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Input
          placeholder="Ciudad"
          defaultValue={currentFilters.city || ""}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="w-full rounded-xl border border-zinc-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Input
          placeholder="Region"
          defaultValue={currentFilters.region || ""}
          onChange={(e) => updateFilter("region", e.target.value)}
          className="w-full rounded-xl border border-zinc-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />

        <Select
          selectedKey={currentFilters.min_rating || "__all"}
          onSelectionChange={(key) =>
            updateFilter("min_rating", String(key) === "__all" ? "" : String(key ?? ""))
          }
          placeholder="Rating minimo"
          className="w-full"
        >
          <Select.Trigger className="bg-black/30 border border-zinc-500/25 rounded-xl min-h-10 text-sm" />
          <Select.Popover>
            <ListBox>
              {ratingOptions.map((opt) => {
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
          selectedKey={currentFilters.sort || "rating-desc"}
          onSelectionChange={(key) => updateFilter("sort", String(key ?? "rating-desc"))}
          placeholder="Ordenar"
          className="w-full"
        >
          <Select.Trigger className="bg-black/30 border border-zinc-500/25 rounded-xl min-h-10 text-sm" />
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
