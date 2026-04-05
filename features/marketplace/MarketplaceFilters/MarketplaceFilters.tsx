"use client";

import { useState } from "react";
import { Accordion } from "@heroui/react/accordion";
import { Button } from "@heroui/react/button";
import { Input } from "@heroui/react/input";
import { Slider } from "@heroui/react/slider";

import { useFilterParams } from "@/lib/hooks/use-filter-params";
import type { CatalogGame } from "@/lib/types/catalog";

const conditionOptions = [
  { value: "M", label: "Mint" },
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Light Played" },
  { value: "MP", label: "Moderate Played" },
  { value: "HP", label: "Heavy Played" },
  { value: "DMG", label: "Damaged" },
];

const conditionChips = [
  { value: "M", label: "Mint" },
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Played" },
  { value: "DMG", label: "Damaged" },
];

const sortOptions = [
  { value: "newest", label: "Más recientes" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
];

const categoryOptions = [
  { value: "singles", label: "Cartas sueltas" },
  { value: "decks", label: "Mazos armados" },
  { value: "sealed", label: "Producto Sellado" },
  { value: "accessories", label: "Accesorios" },
];

const sellerTypeOptions = [
  { value: "", label: "Todos" },
  { value: "store", label: "Tiendas" },
  { value: "user", label: "Usuarios particulares" },
];

interface Props {
  currentFilters: Record<string, string | undefined>;
  games?: CatalogGame[];
}

export default function MarketplaceFilters({ currentFilters, games = [] }: Props) {
  const { updateFilter, clearFilters: resetUrl } = useFilterParams();

  // Local state for price range to debounce Slider updates
  const [priceRange, setPriceRange] = useState<number[]>([
    currentFilters.min_price ? Number(currentFilters.min_price) : 0,
    currentFilters.max_price ? Number(currentFilters.max_price) : 100000,
  ]);

  const applyPriceFilter = () => {
    updateFilter("min_price", priceRange[0] > 0 ? String(priceRange[0]) : "");
    updateFilter("max_price", priceRange[1] < 100000 ? String(priceRange[1]) : "");
  };

  const clearFilters = () => {
    resetUrl();
    setPriceRange([0, 100000]);
  };

  const hasActiveFilters = Object.values(currentFilters).some(Boolean);
  const safeGames = Array.isArray(games) ? games : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Active Filters Clear Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--foreground)]">Filtros</h3>
        {hasActiveFilters && (
          <Button size="sm" variant="danger-soft" onPress={clearFilters} className="h-8 text-xs">
            Limpiar
          </Button>
        )}
      </div>

      {/* Quick Condition Chips */}
      <div>
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 block">Estado rápido</span>
        <div className="flex flex-wrap gap-1.5">
          {conditionChips.map((opt) => {
            const isActive = currentFilters.condition === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateFilter("condition", isActive ? "" : opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
                  : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Seller Type Toggle */}
      <div>
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 block">Vendedor</span>
        <div className="flex gap-1.5">
          {[
            { value: "", label: "Todos" },
            { value: "user", label: "Particular" },
            { value: "store", label: "Tienda" },
          ].map((opt) => {
            const isActive = (currentFilters.seller_type || "") === opt.value;
            return (
              <button
                key={opt.value || "__all"}
                onClick={() => updateFilter("seller_type", opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex-1 text-center ${isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
                  : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Accordion defaultExpandedKeys={["condition", "price", "game"]} className="px-0">

        {/* Sort */}
        <Accordion.Item key="sort">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Ordenar por</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                {sortOptions.map((opt) => {
                  const isActive = (currentFilters.sort || "newest") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter("sort", opt.value)}
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

        {/* Game filter */}
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
                      onClick={() => updateFilter("game", isActive ? "" : g.slug)}
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

        {/* Category */}
        <Accordion.Item key="category">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Categoría</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                {categoryOptions.map((opt) => {
                  const isActive = currentFilters.category === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter("category", isActive ? "" : opt.value)}
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

        {/* Condition */}
        <Accordion.Item key="condition">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Estado</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                {conditionOptions.map((opt) => {
                  const isActive = currentFilters.condition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter("condition", isActive ? "" : opt.value)}
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

        {/* Price */}
        <Accordion.Item key="price">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Rango de Precio</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-4 px-2 mt-4 pb-2">
                <Slider
                  step={100}
                  minValue={0}
                  maxValue={100000}
                  value={priceRange}
                  onChange={(value) => setPriceRange(value as number[])}
                  onChangeEnd={applyPriceFilter}
                  formatOptions={{ style: 'currency', currency: 'CLP' }}
                  className="w-full"
                >
                  <Slider.Output />
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={String(priceRange[0])}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    onBlur={applyPriceFilter}
                    className="w-full bg-[var(--surface-secondary)] px-2 py-1 rounded-md"
                  />
                  <Input
                    type="number"
                    value={String(priceRange[1])}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    onBlur={applyPriceFilter}
                    className="w-full bg-[var(--surface-secondary)] px-2 py-1 rounded-md"
                  />
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Seller Type */}
        <Accordion.Item key="seller">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="text-sm font-semibold">Tipo de vendedor</span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <div className="flex flex-col gap-2 mt-2">
                {sellerTypeOptions.map((opt) => {
                  const isActive = (currentFilters.seller_type || "") === opt.value;
                  return (
                    <button
                      key={opt.value || "__all"}
                      onClick={() => updateFilter("seller_type", opt.value)}
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

        {/* Location */}
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
                placeholder="Ciudad o región"
                defaultValue={currentFilters.city || ""}
                onChange={(e) => updateFilter("city", e.target.value)}
                className="w-full mt-1"
              />
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
