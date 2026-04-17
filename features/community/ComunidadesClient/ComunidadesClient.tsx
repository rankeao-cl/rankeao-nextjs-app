"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Tenant } from "@/lib/types/tenant";
import type { Clan } from "@/lib/types/clan";
import { Persons } from "@gravity-ui/icons";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ui/ViewToggle";
import ClanesClient from "@/features/clan/ClanesClient";

interface SortLink {
  key: string;
  label: string;
  href: string;
  active: boolean;
}

interface Props {
  tenants: Tenant[];
  sortLinks: SortLink[];
  page: number;
  totalPages: number;
  paginationPrev: string | null;
  paginationNext: string | null;
  initialQuery?: string;
  activeType?: "tiendas" | "clanes";
  clans?: Clan[];
}

export default function ComunidadesClient({
  tenants,
  sortLinks,
  page,
  totalPages,
  paginationPrev,
  paginationNext,
  initialQuery,
  activeType = "tiendas",
  clans = [],
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    params.set("page", "1");
    router.push(`/comunidades?${params.toString()}`);
  };

  // ── Clanes mode: delegate to ClanesClient ──
  if (activeType === "clanes") {
    return <ClanesClient initialClans={clans} initialQuery={initialQuery} />;
  }

  return (
    <div>
      {/* ── Search + view toggle ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
        <form
          onSubmit={handleSearch}
          className="flex-1 flex items-center bg-surface-solid rounded-full px-3.5 py-2.5 border border-border gap-2"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda o comunidad..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground p-0"
          />
          {search && (
            <button onClick={() => setSearch("")} type="button" className="bg-none border-none cursor-pointer p-0">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </form>
        {/* View toggle */}
        <ViewToggle
          currentView={viewMode}
          options={[
            { key: "grid", icon: GRID_ICON, ariaLabel: "Vista cuadricula" },
            { key: "list", icon: LIST_ICON, ariaLabel: "Vista lista" },
          ]}
          onChange={(v) => setViewMode(v as "grid" | "list")}
        />
      </div>

      {/* ── Sort pills ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {sortLinks.map((opt) => (
          <a
            key={opt.key}
            href={opt.href}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer no-underline shrink-0 ${
              opt.active
                ? "bg-foreground text-background border border-transparent"
                : "bg-surface-solid text-muted border border-border"
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      {/* ── Results ── */}
      <div className="mx-4 lg:mx-6 mb-12">
        {tenants.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                {tenants.map((tenant) => (
                  <TenantCard key={tenant.id} tenant={tenant} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {tenants.map((tenant) => (
                  <TenantListRow key={tenant.id} tenant={tenant} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-4 px-6 py-3 rounded-full border border-border bg-surface-solid">
                  <a
                    href={paginationPrev || "#"}
                    className="text-[14px] font-semibold no-underline"
                    style={{
                      color: paginationPrev ? "var(--foreground)" : "var(--muted)",
                      pointerEvents: paginationPrev ? "auto" : "none",
                    }}
                  >
                    Anterior
                  </a>
                  <span className="text-[12px] font-semibold text-muted">
                    {page} de {totalPages}
                  </span>
                  <a
                    href={paginationNext || "#"}
                    className="text-[14px] font-semibold no-underline"
                    style={{
                      color: paginationNext ? "var(--foreground)" : "var(--muted)",
                      pointerEvents: paginationNext ? "auto" : "none",
                    }}
                  >
                    Siguiente
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-12">
            <div className="w-[72px] h-[72px] rounded-full bg-surface-solid flex items-center justify-center mb-4">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-foreground text-[15px] font-semibold m-0 mb-1">
              No se encontraron comunidades
            </p>
            <p className="text-muted text-[13px] m-0">
              Intenta buscar con otros terminos o explorar sin filtros.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tenant Grid Card (epic, like clanes) ── */
function TenantCard({ tenant }: { tenant: Tenant }) {
  const tenantRating = tenant.avg_rating ?? tenant.rating;
  const hasRating = tenantRating != null && tenantRating > 0;
  const ratingColor = !hasRating ? "var(--muted)" : tenantRating! >= 4 ? "var(--success)" : tenantRating! >= 3 ? "var(--warning)" : "var(--danger)";

  return (
    <Link href={`/comunidades/${tenant.slug || tenant.id}`} className="no-underline block h-full">
      <div className="bg-surface-solid rounded-[20px] border border-border overflow-hidden h-full flex flex-col">
        {/* Banner */}
        <div className="h-[110px] relative overflow-hidden">
          {tenant.banner_url ? (
            <Image src={tenant.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" />
          ) : tenant.logo_url ? (
            <>
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, var(--surface-tertiary), var(--surface-secondary))" }}
              />
              <Image
                src={tenant.logo_url}
                alt=""
                fill
                sizes="33vw"
                className="object-contain p-4 opacity-20"
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, var(--surface-tertiary), var(--surface-secondary))" }}
            />
          )}
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--background) 0%, color-mix(in srgb, var(--overlay) 55%, transparent) 40%, color-mix(in srgb, var(--overlay) 20%, transparent) 100%)",
            }}
          />

          {/* Floating badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start">
            {/* Left: location */}
            <div>
              {tenant.city && (
                <span
                  className="text-[10px] font-semibold text-foreground inline-flex items-center gap-[3px] rounded-full px-2 py-[3px]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--overlay) 70%, transparent)",
                    border: "1px solid var(--border)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {tenant.city}
                </span>
              )}
            </div>
            {/* Right: status badges */}
            <div className="flex gap-1">
              {tenant.is_public && (
                <span
                  className="text-[10px] font-bold text-success rounded-full px-2.5 py-[3px]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--overlay) 75%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Activa
                </span>
              )}
              {tenant.is_open && (
                <span
                  className="text-[10px] font-bold text-accent rounded-full px-2.5 py-[3px]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--overlay) 75%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Abierta
                </span>
              )}
            </div>
          </div>

          {/* Logo + Name overlaid on banner bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 flex items-end gap-3">
            <div
              className="w-[52px] h-[52px] rounded-[14px] border-[3px] border-surface-solid bg-surface-solid-secondary overflow-hidden flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
            >
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} width={52} height={52} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-[20px] font-black text-accent">
                  {tenant.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 mb-0.5">
              <h3 className="text-[16px] font-extrabold text-foreground m-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {tenant.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-3.5 pt-2.5 pb-3.5 flex-1 flex flex-col">
          {tenant.description ? (
            <p className="line-clamp-2 text-[12px] text-muted m-0 mb-2.5 leading-[17px]">
              {tenant.description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {/* Footer stats row */}
          <div className="flex items-center bg-surface rounded-[10px] px-2.5 py-2 gap-1">
            <div className="flex-1 text-center">
              <p className="text-[14px] font-extrabold m-0" style={{ color: hasRating ? ratingColor : "var(--foreground)" }}>
                {hasRating ? tenantRating!.toFixed(1) : "\u2014"}
              </p>
              <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Rating</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[14px] font-extrabold text-foreground m-0">
                {tenant.review_count ?? 0}
              </p>
              <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Reviews</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[12px] font-extrabold text-foreground m-0">
                {tenant.city ?? "\u2014"}
              </p>
              <p className="text-[9px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Ciudad</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Tenant List Row (epic, like clanes) ── */
function TenantListRow({ tenant }: { tenant: Tenant }) {
  const tenantRating = tenant.avg_rating ?? tenant.rating;
  const hasRating = tenantRating != null && tenantRating > 0;
  const ratingColor = !hasRating ? "var(--muted)" : tenantRating! >= 4 ? "var(--success)" : tenantRating! >= 3 ? "var(--warning)" : "var(--danger)";

  return (
    <Link href={`/comunidades/${tenant.slug || tenant.id}`} className="no-underline block">
      <div className="bg-surface-solid rounded-2xl border border-border overflow-hidden flex relative">
        {/* Banner background stretched behind */}
        {(tenant.banner_url || tenant.logo_url) && (
          <div className="absolute inset-0 overflow-hidden">
            {tenant.banner_url ? (
              <Image src={tenant.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="100vw" />
            ) : tenant.logo_url ? (
              <>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, var(--surface-tertiary), var(--surface-secondary))" }}
                />
                <Image
                  src={tenant.logo_url}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-contain p-6 opacity-15"
                />
              </>
            ) : null}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--surface-solid) 92%, transparent), color-mix(in srgb, var(--surface-solid) 75%, transparent))" }} />
          </div>
        )}

        {/* Content */}
        <div className="relative z-[1] flex items-center gap-3.5 px-4 py-3.5 w-full">
          {/* Logo */}
          <div
            className="w-[52px] h-[52px] rounded-[14px] bg-surface-solid-secondary overflow-hidden flex items-center justify-center shrink-0 border-2 border-border"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt={tenant.name} width={52} height={52} className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-[20px] font-black text-accent">{tenant.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-[3px]">
              <span className="text-[15px] font-extrabold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                {tenant.name}
              </span>
              {tenant.is_public && (
                <span className="text-[9px] font-bold text-success px-2 py-[2px] rounded-full shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)" }}>
                  Activa
                </span>
              )}
              {tenant.is_open && (
                <span className="text-[9px] font-bold text-accent px-2 py-[2px] rounded-full shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                  Abierta
                </span>
              )}
            </div>
            {tenant.description && (
              <p className="text-[12px] text-muted m-0 mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                {tenant.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted">
              {hasRating && (
                <span className="flex items-center gap-[3px]">
                  <span style={{ color: ratingColor }}>&#9733;</span> {tenantRating!.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-[3px]">
                <Persons className="w-3 h-3" /> {tenant.review_count ?? 0}
              </span>
              {tenant.city && (
                <span className="flex items-center gap-[3px]">
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {tenant.city}{tenant.region ? `, ${tenant.region}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Stats mini on desktop */}
          <div className="hidden sm:flex gap-0.5 shrink-0">
            <div className="text-center px-2.5 py-1">
              <p className="text-[14px] font-extrabold m-0" style={{ color: hasRating ? ratingColor : "var(--muted)" }}>
                {hasRating ? tenantRating!.toFixed(1) : "\u2014"}
              </p>
              <p className="text-[8px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Rating</p>
            </div>
            <div className="w-px h-7 bg-border self-center" />
            <div className="text-center px-2.5 py-1">
              <p className="text-[14px] font-extrabold text-foreground m-0">{tenant.review_count ?? 0}</p>
              <p className="text-[8px] font-semibold text-muted m-0 uppercase tracking-[0.5px]">Reviews</p>
            </div>
          </div>

          {/* Chevron */}
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
