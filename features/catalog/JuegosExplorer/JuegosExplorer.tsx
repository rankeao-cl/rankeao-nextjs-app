"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import { getGameBrand } from "@/lib/gameLogos";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ui/ViewToggle";

function GameLogo({ game, size = 48 }: { game: CatalogGame; size?: number }) {
    const brand = getGameBrand(game.slug);
    const src = game.logo_url || brand.logo;
    if (src) {
        return <Image src={src} alt={game.name} width={size} height={size} className="w-full h-full object-cover" />;
    }
    return (
        <div className="w-full h-full flex items-center justify-center font-black text-xs" style={{ background: brand.bg, color: brand.color }}>
            {game.short_name || game.slug.toUpperCase().slice(0, 3)}
        </div>
    );
}

interface Props {
    games: (CatalogGame & { tournaments_count?: number; sets_count?: number })[];
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
            {/* Search + toggle */}
            <div className="flex items-center gap-2 mb-3">
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 999, padding: "10px 14px" }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder="Buscar juego..." value={query} onChange={(e) => setQuery(e.target.value)}
                        style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", fontSize: 14, color: "var(--foreground)", padding: 0 }} />
                    {query && (
                        <button onClick={() => setQuery("")} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </button>
                    )}
                </div>
                <ViewToggle
                    currentView={viewMode}
                    options={[
                        { key: "grid", icon: GRID_ICON, ariaLabel: "Vista cuadricula" },
                        { key: "list", icon: LIST_ICON, ariaLabel: "Vista lista" },
                    ]}
                    onChange={(v) => setViewMode(v as "grid" | "list")}
                />
            </div>

            {/* Grid view */}
            {viewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 48 }}>
                    {filtered.map((game) => <GameCard key={game.slug} game={game} />)}
                    {filtered.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
                            <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "var(--surface-solid)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                                <span style={{ fontSize: 28, opacity: 0.4 }}>🎮</span>
                            </div>
                            <p style={{ color: "var(--foreground)", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>No se encontraron juegos</p>
                            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Intenta con otro termino de busqueda</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 48 }}>
                    {filtered.map((game) => <GameListRow key={game.slug} game={game} />)}
                    {filtered.length === 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
                            <p style={{ color: "var(--foreground)", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>No se encontraron juegos</p>
                            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Intenta con otro termino de busqueda</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Game Grid Card (comunidades style) ── */
function GameCard({ game }: { game: CatalogGame & { tournaments_count?: number; sets_count?: number } }) {
    const brand = getGameBrand(game.slug);
    const formats = Array.isArray(game.formats) ? game.formats : [];

    return (
        <Link href={`/juegos/${game.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div style={{
                backgroundColor: "var(--surface-solid)", borderRadius: 20,
                border: "1px solid var(--border)", overflow: "hidden",
                height: "100%", display: "flex", flexDirection: "column",
            }}>
                {/* Banner area with brand gradient */}
                <div style={{ height: 100, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand.bg || "var(--surface-solid-secondary)"}, var(--surface-solid))` }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--surface-solid) 0%, color-mix(in srgb, var(--surface-solid) 40%, transparent) 60%, rgba(0,0,0,0.1) 100%)" }} />

                    {/* Floating badges */}
                    <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
                        {formats.length > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: brand.color, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                {formats.length} formato{formats.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Logo + Name on banner */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px", display: "flex", alignItems: "flex-end", gap: 12 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            border: "3px solid var(--surface-solid)", backgroundColor: "var(--surface)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                        }}>
                            <GameLogo game={game} size={52} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginBottom: 2 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                {game.name}
                            </h3>
                            {game.publisher && (
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{game.publisher}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {game.description ? (
                        <p className="line-clamp-2" style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginBottom: 10, lineHeight: "17px" }}>
                            {game.description}
                        </p>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}

                    {/* Formats pills */}
                    {formats.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                            {formats.slice(0, 4).map((f) => (
                                <span key={f.id || f.slug} style={{
                                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                                    border: `1px solid ${brand.color}30`, backgroundColor: `${brand.color}10`, color: brand.color,
                                }}>
                                    {f.name}
                                </span>
                            ))}
                            {formats.length > 4 && (
                                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: "var(--muted)", backgroundColor: "var(--surface)" }}>
                                    +{formats.length - 4}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stats row */}
                    <div style={{
                        display: "flex", alignItems: "center", backgroundColor: "var(--surface-tertiary)",
                        borderRadius: 10, padding: "8px 10px", gap: 4,
                    }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: brand.color, margin: 0 }}>{formats.length}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Formatos</p>
                        </div>
                        <div style={{ width: 0.5, height: 24, backgroundColor: "var(--overlay)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{game.tournaments_count ?? 0}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Torneos</p>
                        </div>
                        {(game.sets_count ?? 0) > 0 && (<>
                            <div style={{ width: 0.5, height: 24, backgroundColor: "var(--overlay)" }} />
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{game.sets_count}</p>
                                <p style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Sets</p>
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ── Game List Row (comunidades style) ── */
function GameListRow({ game }: { game: CatalogGame & { tournaments_count?: number; sets_count?: number } }) {
    const brand = getGameBrand(game.slug);
    const formats = Array.isArray(game.formats) ? game.formats : [];

    return (
        <Link href={`/juegos/${game.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "var(--surface-solid)", borderRadius: 16,
                border: "1px solid var(--border)", overflow: "hidden",
                display: "flex", position: "relative",
            }}>
                {/* Brand gradient background */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${brand.bg || "var(--surface-solid-secondary)"}40, transparent 40%)` }} />
                </div>

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%" }}>
                    {/* Logo */}
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, backgroundColor: "var(--surface)", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, border: `2px solid ${brand.color}30`, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}>
                        <GameLogo game={game} size={48} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.name}</span>
                            {game.publisher && <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{game.publisher}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)" }}>
                            <span><span style={{ fontWeight: 700, color: brand.color }}>{formats.length}</span> formatos</span>
                            {formats.slice(0, 3).map((f) => (
                                <span key={f.id || f.slug} style={{ backgroundColor: `${brand.color}15`, color: brand.color, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                    {f.name}
                                </span>
                            ))}
                            {formats.length > 3 && <span style={{ fontSize: 10 }}>+{formats.length - 3}</span>}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="hidden sm:flex" style={{ gap: 2, flexShrink: 0 }}>
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: brand.color, margin: 0 }}>{formats.length}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Formatos</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "var(--overlay)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{game.tournaments_count ?? 0}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Torneos</p>
                        </div>
                    </div>

                    {/* Chevron */}
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
