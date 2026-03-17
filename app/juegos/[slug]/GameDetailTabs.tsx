"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
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
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mt-4 mb-6 relative z-10">
                {tabs.map((tab) => (
                    <a
                        key={tab.id}
                        href={`/juegos/${slug}?tab=${tab.id}`}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? "text-white shadow-md"
                                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                        }`}
                        style={activeTab === tab.id ? { background: brand.color, color: brand.bg } : undefined}
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
                        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
                            Formatos Competitivos
                        </h2>
                        {formats.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {formats.map((format) => (
                                    <div
                                        key={format.id}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3 hover:border-[var(--accent)]/30 transition-colors"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: `${brand.color}15` }}
                                        >
                                            <span className="text-base" style={{ color: brand.color }}>
                                                {format.is_ranked ? "\u{1F3C6}" : "\u{1F0CF}"}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm text-[var(--foreground)]">{format.name}</p>
                                            {format.description && (
                                                <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{format.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                {format.is_ranked && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--warning)]/10 text-[var(--warning)]">
                                                        Ranked
                                                    </span>
                                                )}
                                                {format.rules_url && (
                                                    <a
                                                        href={format.rules_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
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
                            <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
                                <p className="text-2xl mb-2 opacity-50">{"\u{1F0CF}"}</p>
                                <p className="text-sm text-[var(--muted)]">No hay formatos registrados aun.</p>
                            </div>
                        )}
                    </section>

                    {/* About */}
                    <section>
                        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Sobre {game.name}</h2>
                        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
                                {game.description || `Conoce todo acerca de ${game.name}. A medida que la comunidad crezca, iremos agregando los reglamentos oficiales, enlaces a bases de datos utiles y guias para jugadores nuevos.`}
                            </p>
                        </div>
                    </section>

                    {/* Quick links */}
                    <section className="flex flex-wrap gap-3">
                        <Link href={`/torneos?game=${slug}`}>
                            <Button variant="secondary" size="sm" className="font-semibold">
                                Ver Torneos &rarr;
                            </Button>
                        </Link>
                        <Link href={`/ranking?tab=ratings&game=${slug}`}>
                            <Button variant="secondary" size="sm" className="font-semibold">
                                Ver Rankings &rarr;
                            </Button>
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
