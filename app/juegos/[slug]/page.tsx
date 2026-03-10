import { getGameDetail, getGameFormats } from "@/lib/api/catalog";
import { getTournaments } from "@/lib/api/tournaments";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Chip, Tabs } from "@heroui/react";
import { Plus, ShieldCheck } from "@gravity-ui/icons";
import { TournamentCard } from "@/components/cards";

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
            {/* Dynamic Banner section using a placeholder or logic if we eventually have game banners */}
            <div className="relative w-full h-48 md:h-64 lg:h-80 bg-[var(--surface-secondary)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-tertiary)] to-[var(--surface-primary)] opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="text-9xl tracking-widest font-black uppercase blur-sm mix-blend-overlay">
                        {game.name}
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent opacity-90" />
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

                {/* Tabs Content Navigation */}
                <div className="mt-10">
                    <Tabs
                        variant="secondary"
                        className="w-full"
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Opciones del Juego">
                                <Tabs.Tab id="info">
                                    ℹ️ Info y Reglas
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="tournaments">
                                    ⚔️ Torneos
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="leaderboard">
                                    🏆 Rankings
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="community">
                                    📰 Comunidades y Feed
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
                                        <div className="flex flex-wrap gap-2">
                                            {formats.map((format) => (
                                                <Chip key={format.id} variant="secondary" className="border-[var(--border)]">
                                                    {format.name}
                                                </Chip>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[var(--muted)] italic">No hay formatos registrados aún.</p>
                                    )}
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <h2 className="text-xl font-bold mb-4">Sobre {game.name}</h2>
                                    <p className="text-[var(--muted)] whitespace-pre-wrap">
                                        {game.description || `Conoce todo acerca de ${game.name}. A medida que la comunidad crezca, iremos agregando los reglamentos oficiales, enlaces a bases de datos útiles y guías para jugadores nuevos.`}
                                    </p>
                                </div>
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="tournaments">
                            <div className="flex flex-col gap-6">
                                <h2 className="text-xl font-bold">Próximos Torneos</h2>

                                {tournaments.length > 0 ? (
                                    <div className="flex flex-col gap-4 max-w-4xl">
                                        {tournaments.map(tournament => (
                                            <TournamentCard key={tournament.id} tournament={tournament} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                        <p className="text-[var(--muted)]">No hay torneos programados para {game.name}.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="leaderboard">
                            <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                <div className="text-4xl mb-4">🏆</div>
                                <h3 className="text-lg font-bold mb-2">Tabla de Clasificación Global</h3>
                                <p className="text-[var(--muted)]">Muy pronto podrás ver a los mejores jugadores de {game.name} a nivel nacional.</p>
                                <Link href="/ranking">
                                    <Button variant="secondary" className="mt-4">
                                        Ver Ranking General
                                    </Button>
                                </Link>
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="community">
                            <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                <div className="text-4xl mb-4">📰</div>
                                <h3 className="text-lg font-bold mb-2">Feed Social del Juego</h3>
                                <p className="text-[var(--muted)]">Explora los posts, discusiones y un directorio de comunidades que juegan {game.name}. (En construcción)</p>
                            </div>
                        </Tabs.Panel>

                    </Tabs>
                </div>
            </div>
        </div>
    );
}
