"use client";

import Link from "next/link";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import type { GameBrand } from "@/lib/gameLogos";
import GameLeaderboard from "./GameLeaderboard";
import GameActiveTournaments from "./GameActiveTournaments";
import GameCommunities from "./GameCommunities";
import GameFeed from "./GameFeed";

interface Props {
    slug: string;
    activeTab: string;
    game: CatalogGame;
    formats: CatalogFormat[];
    brand: GameBrand;
    tournamentsCount: number;
}

export default function GameDetailTabs({ slug, game, formats, brand }: Props) {
    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Main column ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">

                {/* About */}
                {game.description && (
                    <section style={{
                        padding: "16px 18px", borderRadius: 16,
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface-solid)",
                    }}>
                        <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: "20px", margin: 0, whiteSpace: "pre-wrap" }}>
                            {game.description}
                        </p>
                    </section>
                )}

                {/* Formats */}
                <section>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Formatos Competitivos</h2>
                    </div>
                    {formats.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                            {formats.map((format) => (
                                <div key={format.id} style={{
                                    padding: "14px 16px", borderRadius: 14,
                                    border: "1px solid var(--border)", backgroundColor: "var(--surface-solid)",
                                    display: "flex", alignItems: "center", gap: 12,
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, background: `${brand.color}15`,
                                    }}>
                                        <span style={{ fontSize: 14, color: brand.color }}>
                                            {format.is_ranked ? "\u{1F3C6}" : "\u{1F0CF}"}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)", margin: 0 }}>{format.name}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            {format.is_ranked && (
                                                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: "color-mix(in srgb, var(--yellow) 10%, transparent)", color: "var(--yellow)" }}>
                                                    Ranked
                                                </span>
                                            )}
                                            {format.rules_url && (
                                                <a href={format.rules_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
                                                    className="hover:underline">
                                                    Reglas
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 32, borderRadius: 14, border: "1px solid var(--border)", backgroundColor: "var(--surface-solid)", textAlign: "center" }}>
                            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>No hay formatos registrados aun.</p>
                        </div>
                    )}
                </section>

                {/* Tournaments */}
                <section>
                    <GameActiveTournaments gameSlug={slug} />
                </section>

                {/* Community + Feed */}
                <section className="flex flex-col gap-6">
                    <GameCommunities gameSlug={slug} gameName={game.name} />
                    <GameFeed gameSlug={slug} gameName={game.name} />
                </section>

                {/* Quick links */}
                <section style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                        { href: `/torneos?game=${slug}`, label: "Torneos" },
                        { href: `/ranking?tab=ratings&game=${slug}`, label: "Rankings" },
                        { href: `/marketplace?game=${slug}`, label: "Mercado" },
                    ].map((link) => (
                        <Link key={link.href} href={link.href} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10,
                            padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "var(--foreground)", textDecoration: "none",
                        }} className="hover:border-border">
                            {link.label} &rarr;
                        </Link>
                    ))}
                </section>
            </div>

            {/* ── Right sidebar (desktop) ── */}
            <div className="hidden lg:flex flex-col gap-6 w-[300px] shrink-0">
                <GameLeaderboard gameSlug={slug} />
            </div>

            {/* Leaderboard mobile */}
            <div className="lg:hidden">
                <GameLeaderboard gameSlug={slug} />
            </div>
        </div>
    );
}
