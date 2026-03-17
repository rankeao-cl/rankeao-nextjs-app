import { getGameDetail, getGameFormats } from "@/lib/api/catalog";
import { getTournaments } from "@/lib/api/tournaments";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Chip, Card } from "@heroui/react";
import { Plus, ShieldCheck } from "@gravity-ui/icons";
import { getGameBrand } from "@/lib/gameLogos";
import GameLeaderboard from "./GameLeaderboard";
import GameActiveTournaments from "./GameActiveTournaments";
import GameCommunities from "./GameCommunities";
import GameFeed from "./GameFeed";
import GameDetailTabs from "./GameDetailTabs";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: PageProps) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const gameRes = await getGameDetail(slug).catch(() => null);

    if (!gameRes?.data) return { title: "Juego no encontrado" };

    return {
        title: `${gameRes.data.name} | Rankeao`,
        description: gameRes.data.description || `Torneos, rankings y comunidades de ${gameRes.data.name} en Rankeao.`,
    };
}

export default async function GameDetailPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearch = (await searchParams) ?? {};
    const { slug } = resolvedParams;

    const [gameDetailRes, formatsRes, tournamentsData] = await Promise.all([
        getGameDetail(slug).catch(() => null),
        getGameFormats(slug).catch(() => null),
        getTournaments({ game: slug, per_page: 6 }).catch(() => null),
    ]);

    const game = gameDetailRes?.data;
    if (!game) {
        notFound();
    }

    const rawFormats = formatsRes?.data || formatsRes?.formats;
    const formatsFromEndpoint = Array.isArray(rawFormats) ? rawFormats : [];
    const formats = formatsFromEndpoint.length > 0 ? formatsFromEndpoint : (Array.isArray(game.formats) ? game.formats : []);
    const tournaments = tournamentsData?.tournaments || [];
    const brand = getGameBrand(slug);
    const activeTab = resolvedSearch.tab || "info";

    return (
        <div className="flex flex-col w-full">
            {/* Compact hero with brand gradient */}
            <div
                className="relative w-full overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${brand.bg}, var(--background))` }}
            >
                {/* Decorative blurs */}
                <div
                    className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] opacity-15 pointer-events-none"
                    style={{ background: brand.color }}
                />
                <div
                    className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full blur-[80px] opacity-10 pointer-events-none"
                    style={{ background: brand.color }}
                />

                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-10 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                        {/* Logo */}
                        <div
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 shadow-xl flex-shrink-0 bg-[var(--surface)]"
                            style={{ borderColor: `${brand.color}40` }}
                        >
                            {game.logo_url ? (
                                <Image
                                    src={game.logo_url}
                                    alt={`Logo de ${game.name}`}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center font-black text-2xl"
                                    style={{ background: brand.bg, color: brand.color }}
                                >
                                    {game.short_name || game.slug.toUpperCase().slice(0, 3)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                                    {game.name}
                                </h1>
                                <Chip size="sm" color="success" variant="soft" className="font-bold border-none gap-1 shrink-0">
                                    <ShieldCheck className="size-3" />
                                    Oficial
                                </Chip>
                            </div>
                            {game.publisher && (
                                <p className="text-sm text-white/50 font-medium">{game.publisher}</p>
                            )}
                            {game.description && (
                                <p className="text-sm text-white/60 leading-relaxed mt-2 max-w-2xl line-clamp-2">
                                    {game.description}
                                </p>
                            )}

                            {/* Quick stats inline */}
                            <div className="flex items-center gap-5 mt-4 text-sm">
                                <div>
                                    <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Formatos</span>
                                    <p className="text-white font-bold text-lg leading-tight">{formats.length}</p>
                                </div>
                                <div>
                                    <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Torneos</span>
                                    <p className="text-white font-bold text-lg leading-tight">{tournaments.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex gap-2 sm:flex-col shrink-0">
                            <Button
                                variant="primary"
                                size="sm"
                                className="font-bold shadow-lg"
                                style={{ background: brand.color, color: brand.bg }}
                            >
                                <Plus className="size-4" /> Yo Juego Esto
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom fade into page */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* Tab navigation + content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full mb-12">
                <GameDetailTabs
                    slug={slug}
                    activeTab={activeTab}
                    game={game}
                    formats={formats}
                    brand={brand}
                    tournamentsCount={tournaments.length}
                />
            </div>
        </div>
    );
}
