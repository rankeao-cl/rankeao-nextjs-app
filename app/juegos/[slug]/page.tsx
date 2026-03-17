import { getGameDetail, getGameFormats } from "@/lib/api/catalog";
import { getTournaments } from "@/lib/api/tournaments";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Chip, Tabs, Card } from "@heroui/react";
import { Plus, ShieldCheck } from "@gravity-ui/icons";
import GameLeaderboard from "./GameLeaderboard";
import GameActiveTournaments from "./GameActiveTournaments";
import GameCommunities from "./GameCommunities";
import GameFeed from "./GameFeed";

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

export default async function GameDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const [gameDetailRes, formatsRes, tournamentsData] = await Promise.all([
        getGameDetail(slug).catch(() => null),
        getGameFormats(slug).catch(() => null),
        getTournaments({ game: slug, per_page: 4 }).catch(() => null),
    ]);

    const game = gameDetailRes?.data;
    if (!game) {
        notFound();
    }

    const rawFormats = formatsRes?.data || formatsRes?.formats;
    const formats = Array.isArray(rawFormats) ? rawFormats : [];
    const tournaments = tournamentsData?.tournaments || [];

    return (
        <div className="flex flex-col w-full">
            {/* Banner */}
            <div className="relative w-full h-48 md:h-64 lg:h-80 bg-[var(--surface-secondary)] overflow-hidden">
                <div className="absolute inset-0 bg-[var(--surface-tertiary)] opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="text-9xl tracking-widest font-black uppercase blur-sm mix-blend-overlay">
                        {game.name}
                    </div>
                </div>
                <div className="absolute inset-0 bg-[var(--background)] opacity-70" />
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full relative -mt-16 sm:-mt-24 mb-12">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                    {/* Game Logo */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[var(--surface)] border-4 border-[var(--background)] overflow-hidden flex-shrink-0 shadow-2xl p-2 flex items-center justify-center">
                        {game.logo_url ? (
                            <Image
                                src={game.logo_url}
                                alt={`Logo de ${game.name}`}
                                fill
                                className="object-contain p-2"
                            />
                        ) : (
                            <div className="text-5xl">🎴</div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 pb-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
                                    {game.name}
                                </h1>
                                <Chip size="sm" color="success" variant="soft" className="font-bold border-none gap-1">
                                    <ShieldCheck className="size-3 inline-block mr-1" />
                                    Juego Oficial
                                </Chip>
                            </div>
                        </div>
                        {game.description && (
                            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] max-w-3xl line-clamp-3">
                                {game.description}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row sm:flex-col gap-3 pb-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <Button
                            variant="primary"
                            className="font-bold flex-1 sm:flex-none shadow-lg shadow-[var(--accent)]/20"
                        >
                            <Plus className="size-4" /> Yo Juego Esto
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="flex gap-3 mt-6 flex-wrap">
                    <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden min-w-[120px]">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
                        <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Formatos</p>
                        <p className="text-xl font-bold text-[var(--foreground)]">{formats.length}</p>
                    </div>
                    <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden min-w-[120px]">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
                        <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Torneos</p>
                        <p className="text-xl font-bold text-[var(--foreground)]">{tournaments.length}</p>
                    </div>
                </div>

                {/* Tabs Content Navigation */}
                <div className="mt-10">
                    <Tabs
                        variant="secondary"
                        className="w-full"
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Opciones del Juego">
                                <Tabs.Tab id="info">
                                    Info y Reglas
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="tournaments">
                                    Torneos
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="leaderboard">
                                    Rankings
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="community">
                                    Comunidades y Feed
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>

                        <Tabs.Panel id="info">
                            <div className="flex flex-col gap-8">
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        Formatos Competitivos
                                    </h2>
                                    {formats.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {formats.map((format) => (
                                                <div
                                                    key={format.id}
                                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                                                        <span className="text-base">🃏</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-[var(--foreground)] truncate">{format.name}</p>
                                                        {format.description && (
                                                            <p className="text-xs text-[var(--muted)] line-clamp-1">{format.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                            <Card.Content className="py-12 text-center">
                                                <p className="text-3xl mb-3 opacity-50">🃏</p>
                                                <p className="text-[var(--muted)] italic">No hay formatos registrados aún.</p>
                                            </Card.Content>
                                        </Card>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold mb-4">Sobre {game.name}</h2>
                                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                                        <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
                                            {game.description || `Conoce todo acerca de ${game.name}. A medida que la comunidad crezca, iremos agregando los reglamentos oficiales, enlaces a bases de datos útiles y guías para jugadores nuevos.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="tournaments">
                            <GameActiveTournaments gameSlug={slug} />
                        </Tabs.Panel>

                        <Tabs.Panel id="leaderboard">
                            <GameLeaderboard gameSlug={slug} />
                        </Tabs.Panel>

                        <Tabs.Panel id="community">
                            <div className="flex flex-col gap-10">
                                <GameCommunities gameSlug={slug} gameName={game.name} />
                                <GameFeed gameSlug={slug} gameName={game.name} />
                            </div>
                        </Tabs.Panel>

                    </Tabs>
                </div>
            </div>
        </div>
    );
}
