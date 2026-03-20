"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Tenant } from "@/lib/types/tenant";
import { Persons } from "@gravity-ui/icons";

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
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: "#F59E0B", fontSize: 12, letterSpacing: 1 }}>
      {"★".repeat(full)}{half ? "☆" : ""}
    </span>
  );
}

export default function ComunidadesClient({
  tenants,
  sortLinks,
  page,
  totalPages,
  paginationPrev,
  paginationNext,
  initialQuery,
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

  return (
    <div>
      {/* ── Search + view toggle ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            backgroundColor: "#1A1A1E",
            borderRadius: 999,
            padding: "10px 14px",
            border: "1px solid rgba(255,255,255,0.06)",
            gap: 8,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda o comunidad..."
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#F2F2F2",
              padding: 0,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </form>
        {/* View toggle */}
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 8,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {viewMode === "grid" ? (
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="3.5" rx="1" fill="#F2F2F2" />
              <rect x="1" y="6.25" width="14" height="3.5" rx="1" fill="#F2F2F2" />
              <rect x="1" y="11.5" width="14" height="3.5" rx="1" fill="#F2F2F2" />
            </svg>
          ) : (
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Sort pills ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {sortLinks.map((opt) => (
          <a
            key={opt.key}
            href={opt.href}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
              textDecoration: "none",
              backgroundColor: opt.active ? "#F2F2F2" : "#1A1A1E",
              color: opt.active ? "#000000" : "#888891",
              border: opt.active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {tenants.map((tenant) => (
                  <TenantCard key={tenant.id} tenant={tenant} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tenants.map((tenant) => (
                  <TenantListRow key={tenant.id} tenant={tenant} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 24px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "#1A1A1E",
                  }}
                >
                  <a
                    href={paginationPrev || "#"}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      color: paginationPrev ? "#F2F2F2" : "#888891",
                      pointerEvents: paginationPrev ? "auto" : "none",
                    }}
                  >
                    Anterior
                  </a>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#888891" }}>
                    {page} de {totalPages}
                  </span>
                  <a
                    href={paginationNext || "#"}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      color: paginationNext ? "#F2F2F2" : "#888891",
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#1A1A1E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p style={{ color: "#F2F2F2", fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 4 }}>
              No se encontraron comunidades
            </p>
            <p style={{ color: "#888891", fontSize: 13, margin: 0 }}>
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
  const hasRating = tenant.rating != null && tenant.rating > 0;

  return (
    <Link href={`/comunidades/${tenant.slug || tenant.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div
        style={{
          backgroundColor: "#1A1A1E",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Banner */}
        <div style={{ height: 110, position: "relative", overflow: "hidden" }}>
          {tenant.banner_url ? (
            <Image src={tenant.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" />
          ) : tenant.logo_url ? (
            <Image src={tenant.logo_url} alt="" fill style={{ objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.25 }} sizes="33vw" />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b, #0f172a)" }} />
          )}
          {/* Dark overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1A1E 0%, rgba(26,26,30,0.6) 50%, rgba(0,0,0,0.2) 100%)" }} />

          {/* Floating badges */}
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left: location */}
            <div>
              {tenant.city && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {tenant.city}
                </span>
              )}
            </div>
            {/* Right: status badges */}
            <div style={{ display: "flex", gap: 4 }}>
              {tenant.is_public && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                  Activa
                </span>
              )}
              {tenant.is_open && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                  Abierta
                </span>
              )}
            </div>
          </div>

          {/* Logo + Name overlaid on banner bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px", display: "flex", alignItems: "flex-end", gap: 12 }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 14,
                border: "3px solid #1A1A1E",
                backgroundColor: "#222226", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} width={52} height={52} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>
                  {tenant.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, marginBottom: 2 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {tenant.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
          {tenant.description ? (
            <p className="line-clamp-2" style={{ fontSize: 12, color: "#888891", margin: 0, marginBottom: 10, lineHeight: "17px" }}>
              {tenant.description}
            </p>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Footer stats row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              padding: "8px 10px",
              gap: 4,
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "#F2F2F2", margin: 0 }}>
                {hasRating ? tenant.rating!.toFixed(1) : "—"}
              </p>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
            </div>
            <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>
                {tenant.review_count ?? 0}
              </p>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Reviews</p>
            </div>
            <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>
                {tenant.city ?? "—"}
              </p>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Ciudad</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Tenant List Row (epic, like clanes) ── */
function TenantListRow({ tenant }: { tenant: Tenant }) {
  const hasRating = tenant.rating != null && tenant.rating > 0;

  return (
    <Link href={`/comunidades/${tenant.slug || tenant.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "#1A1A1E",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Banner background stretched behind */}
        {(tenant.banner_url || tenant.logo_url) && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {tenant.banner_url ? (
              <Image src={tenant.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="100vw" />
            ) : tenant.logo_url ? (
              <Image src={tenant.logo_url} alt="" fill style={{ objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.15 }} sizes="100vw" />
            ) : null}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,26,30,0.92), rgba(26,26,30,0.75))" }} />
          </div>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%" }}>
          {/* Logo */}
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              backgroundColor: "#222226", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt={tenant.name} width={52} height={52} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>{tenant.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                {tenant.name}
              </span>
              {tenant.is_public && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                  Activa
                </span>
              )}
              {tenant.is_open && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.15)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                  Abierta
                </span>
              )}
            </div>
            {tenant.description && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tenant.description}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#888891" }}>
              {hasRating && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: "#F59E0B" }}>★</span> {tenant.rating!.toFixed(1)}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Persons style={{ width: 12, height: 12 }} /> {tenant.review_count ?? 0}
              </span>
              {tenant.city && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {tenant.city}{tenant.region ? `, ${tenant.region}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Stats mini on desktop */}
          <div className="hidden sm:flex" style={{ gap: 2, flexShrink: 0 }}>
            <div style={{ textAlign: "center", padding: "4px 10px" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "#888891", margin: 0 }}>
                {hasRating ? tenant.rating!.toFixed(1) : "—"}
              </p>
              <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
            </div>
            <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
            <div style={{ textAlign: "center", padding: "4px 10px" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{tenant.review_count ?? 0}</p>
              <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Reviews</p>
            </div>
          </div>

          {/* Chevron */}
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M6 3l5 5-5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
