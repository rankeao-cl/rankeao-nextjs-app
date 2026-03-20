"use client";

import Link from "next/link";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import type { GameBrand } from "@/lib/gameLogos";
import GameLeaderboard from "./GameLeaderboard";
import GameActiveTournaments from "./GameActiveTournaments";
import GameCommunities from "./GameCommunities";
import GameFeed from "./GameFeed";

const tabs = [
    { id: "info", label: "Info" },
    { id: "tournaments", label: "Torneos" },
    { id: "leaderboard", label: "Rankings" },
    { id: "community", label: "Comunidad" },
];

interface Props {
    slug: string;
    activeTab: string;
    game: CatalogGame;
    formats: CatalogFormat[];
    brand: GameBrand;
    tournamentsCount: number;
}

export default function GameDetailTabs({ slug, activeTab, game, formats, brand }: Props) {
    return (
        <>
            {/* Tab pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6">
                {tabs.map((tab) => (
                    <a
                        key={tab.id}
                        href={`/juegos/${slug}?tab=${tab.id}`}
                        style={
                            activeTab === tab.id
                                ? {
                                      backgroundColor: "#F2F2F2",
                                      color: "#000000",
                                      border: "1px solid transparent",
                                  }
                                : {
                                      backgroundColor: "#1A1A1E",
                                      color: "#888891",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                  }
                        }
                        className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors hover:text-[#F2F2F2]"
                    >
                        {tab.label}
                    </a>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "info" && (
                <div className="space-y-8">
                    {/* Formats grid */}
                    <section>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F2F2F2", marginBottom: 16, margin: 0, paddingBottom: 16 }}>
                            Formatos Competitivos
                        </h2>
                        {formats.length > 0 ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                    gap: 12,
                                }}
                            >
                                {formats.map((format) => (
                                    <div
                                        key={format.id}
                                        style={{
                                            padding: 16,
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            backgroundColor: "#1A1A1E",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                            transition: "border-color 0.2s",
                                        }}
                                        className="hover:border-[rgba(59,130,246,0.3)]"
                                    >
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 8,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: `${brand.color}15`,
                                            }}
                                        >
                                            <span style={{ fontSize: 16, color: brand.color }}>
                                                {format.is_ranked ? "\u{1F3C6}" : "\u{1F0CF}"}
                                            </span>
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontWeight: 600, fontSize: 14, color: "#F2F2F2", margin: 0 }}>{format.name}</p>
                                            {format.description && (
                                                <p
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#888891",
                                                        marginTop: 2,
                                                        margin: 0,
                                                        paddingTop: 2,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {format.description}
                                                </p>
                                            )}
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                                {format.is_ranked && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            paddingLeft: 8,
                                                            paddingRight: 8,
                                                            paddingTop: 2,
                                                            paddingBottom: 2,
                                                            borderRadius: 999,
                                                            backgroundColor: "rgba(234,179,8,0.1)",
                                                            color: "#EAB308",
                                                        }}
                                                    >
                                                        Ranked
                                                    </span>
                                                )}
                                                {format.rules_url && (
                                                    <a
                                                        href={format.rules_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            color: "#3B82F6",
                                                            textDecoration: "none",
                                                        }}
                                                        className="hover:underline"
                                                    >
                                                        Ver reglas
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: 32,
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    backgroundColor: "#1A1A1E",
                                    textAlign: "center",
                                }}
                            >
                                <p style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>{"\u{1F0CF}"}</p>
                                <p style={{ fontSize: 13, color: "#888891", margin: 0 }}>No hay formatos registrados aun.</p>
                            </div>
                        )}
                    </section>

                    {/* About */}
                    <section>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F2F2F2", margin: 0, paddingBottom: 16 }}>
                            Sobre {game.name}
                        </h2>
                        <div
                            style={{
                                padding: 20,
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.06)",
                                backgroundColor: "#1A1A1E",
                            }}
                        >
                            <p style={{ fontSize: 13, color: "#888891", whiteSpace: "pre-wrap", lineHeight: "20px", margin: 0 }}>
                                {game.description || `Conoce todo acerca de ${game.name}. A medida que la comunidad crezca, iremos agregando los reglamentos oficiales, enlaces a bases de datos utiles y guias para jugadores nuevos.`}
                            </p>
                        </div>
                    </section>

                    {/* Quick links */}
                    <section style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <Link
                            href={`/torneos?game=${slug}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "#222226",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 12,
                                paddingLeft: 14,
                                paddingRight: 14,
                                paddingTop: 8,
                                paddingBottom: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#F2F2F2",
                                textDecoration: "none",
                            }}
                        >
                            Ver Torneos &rarr;
                        </Link>
                        <Link
                            href={`/ranking?tab=ratings&game=${slug}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "#222226",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 12,
                                paddingLeft: 14,
                                paddingRight: 14,
                                paddingTop: 8,
                                paddingBottom: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#F2F2F2",
                                textDecoration: "none",
                            }}
                        >
                            Ver Rankings &rarr;
                        </Link>
                    </section>
                </div>
            )}

            {activeTab === "tournaments" && (
                <GameActiveTournaments gameSlug={slug} />
            )}

            {activeTab === "leaderboard" && (
                <GameLeaderboard gameSlug={slug} />
            )}

            {activeTab === "community" && (
                <div className="space-y-10">
                    <GameCommunities gameSlug={slug} gameName={game.name} />
                    <GameFeed gameSlug={slug} gameName={game.name} />
                </div>
            )}
        </>
    );
}
