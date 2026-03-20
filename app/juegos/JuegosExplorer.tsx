"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import { getGameBrand } from "@/lib/gameLogos";

function GameLogo({ game, size = 48 }: { game: CatalogGame; size?: number }) {
  const brand = getGameBrand(game.slug);
  const src = game.logo_url || brand.logo;
  if (src) {
    return (
      <Image
        src={src}
        alt={game.name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-black text-xs"
      style={{ background: brand.bg, color: brand.color }}
    >
      {game.short_name || game.slug.toUpperCase().slice(0, 3)}
    </div>
  );
}

function FormatPill({ format }: { format: CatalogFormat }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        border: "1px solid rgba(59,130,246,0.2)",
        backgroundColor: "rgba(59,130,246,0.08)",
        color: "#3B82F6",
      }}
    >
      {format.name}
    </span>
  );
}

interface Props {
  games: CatalogGame[];
}

export default function JuegosExplorer({ games }: Props) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = query.trim()
    ? games.filter((g) =>
        g.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        g.slug.toLowerCase().includes(query.trim().toLowerCase())
      )
    : games;

  return (
    <div>
      {/* Search + view toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#1A1A1E",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 999,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        {/* Search icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888891"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Buscar juego..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "#F2F2F2",
          }}
          className="placeholder-[#888891]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888891"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        )}
      </div>
      {/* View toggle */}
      <button
        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        style={{ backgroundColor: "#1A1A1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 8, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {viewMode === "grid" ? (
          <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="3.5" rx="1" fill="#F2F2F2" /><rect x="1" y="6.25" width="14" height="3.5" rx="1" fill="#F2F2F2" /><rect x="1" y="11.5" width="14" height="3.5" rx="1" fill="#F2F2F2" />
          </svg>
        ) : (
          <svg width={18} height={18} viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#F2F2F2" /><rect x="9" y="1" width="6" height="6" rx="1" fill="#F2F2F2" />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#F2F2F2" /><rect x="9" y="9" width="6" height="6" rx="1" fill="#F2F2F2" />
          </svg>
        )}
      </button>
      </div>

      {viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
        {filtered.map((game) => {
          const formats = Array.isArray(game.formats) ? game.formats : [];

          return (
            <Link
              key={game.slug}
              href={`/juegos/${game.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                overflow: "hidden",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
              className="hover:border-[rgba(59,130,246,0.4)]"
            >
              {/* Top accent bar */}
              <div style={{ height: 6, width: "100%", backgroundColor: "#3B82F6" }} />

              {/* Card body */}
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                {/* Logo + Title row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <GameLogo game={game} size={56} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#F2F2F2",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {game.name}
                    </h3>
                    {game.publisher && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888891",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {game.publisher}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {game.description && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#888891",
                      lineHeight: "18px",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {game.description}
                  </p>
                )}

                {/* Formats */}
                {formats.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {formats.slice(0, 5).map((f) => (
                      <FormatPill key={f.id || f.slug} format={f} />
                    ))}
                    {formats.length > 5 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#888891",
                          backgroundColor: "#222226",
                        }}
                      >
                        +{formats.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer stats */}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#888891" }}>
                    <span>
                      <span style={{ fontWeight: 700, color: "#F2F2F2" }}>{formats.length}</span> formatos
                    </span>
                    {game.formats_count != null && game.formats_count !== formats.length && (
                      <span>
                        <span style={{ fontWeight: 700, color: "#F2F2F2" }}>{game.formats_count}</span> registrados
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#3B82F6",
                    }}
                  >
                    Explorar &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", backgroundColor: "#1A1A1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "64px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>🎮</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#F2F2F2", margin: 0 }}>No se encontraron juegos</p>
            <p style={{ fontSize: 13, color: "#888891", marginTop: 4 }}>Intenta con otro término de búsqueda</p>
          </div>
        )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 48 }}>
        {filtered.map((game) => {
          const formats = Array.isArray(game.formats) ? game.formats : [];
          const brand = getGameBrand(game.slug);
          return (
            <Link key={game.slug} href={`/juegos/${game.slug}`} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ backgroundColor: "#1A1A1E", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                {/* Accent left bar */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: brand.color || "#3B82F6" }} />

                {/* Logo */}
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                  <GameLogo game={game} size={48} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#F2F2F2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.name}</span>
                    {game.publisher && <span style={{ fontSize: 11, color: "#888891", flexShrink: 0 }}>{game.publisher}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#888891" }}>
                    <span><span style={{ fontWeight: 700, color: "#F2F2F2" }}>{formats.length}</span> formatos</span>
                    {formats.slice(0, 3).map((f) => (
                      <span key={f.id || f.slug} style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "#3B82F6", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {f.name}
                      </span>
                    ))}
                    {formats.length > 3 && <span style={{ color: "#888891", fontSize: 10 }}>+{formats.length - 3}</span>}
                  </div>
                </div>

                {/* Arrow */}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", flexShrink: 0 }}>Explorar →</span>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ backgroundColor: "#1A1A1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "64px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>🎮</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#F2F2F2", margin: 0 }}>No se encontraron juegos</p>
            <p style={{ fontSize: 13, color: "#888891", marginTop: 4 }}>Intenta con otro término de búsqueda</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
