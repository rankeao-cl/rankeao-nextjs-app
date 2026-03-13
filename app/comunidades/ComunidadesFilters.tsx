"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Select, ListBox, Accordion } from "@heroui/react";

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
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--foreground)]">Filtros</h3>
        {Object.values(currentFilters).some(Boolean) && (
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => router.push(pathname)}
            className="h-7 text-xs"
          >
            Limpiar
          </Button>
        )}
      </div>

      <Accordion defaultExpandedKeys={["search", "location", "rating"]} className="px-0">
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
                placeholder="Tienda o comunidad..."
                value={currentFilters.q || ""}
                onChange={(e) => updateFilter("q", e.target.value)}
                className="w-full mt-1"
              />
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="location">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Ubicación</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-3 mt-1">
                <Input
                  placeholder="Ciudad"
                  value={currentFilters.city || ""}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Región"
                  value={currentFilters.region || ""}
                  onChange={(e) => updateFilter("region", e.target.value)}
                  className="w-full"
                />
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item key="rating">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Rating y Orden</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-4 mt-1">
                <Select
                  selectedKey={currentFilters.min_rating || "__all"}
                  onSelectionChange={(key) =>
                    updateFilter("min_rating", String(key) === "__all" ? "" : String(key ?? ""))
                  }
                  placeholder="Rating mínimo"
                  className="w-full"
                >
                  <Select.Trigger className="bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-10 text-sm">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
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
                  placeholder="Ordenar por"
                  className="w-full"
                >
                  <Select.Trigger className="bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-10 text-sm">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
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
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion >

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
            <span className="text-sm text-[var(--muted)]">
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
      )
      }
    </>
  );
}
