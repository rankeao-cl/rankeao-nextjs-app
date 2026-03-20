import { getGameDetail, getGameFormats } from "@/lib/api/catalog";
import { getTournaments } from "@/lib/api/tournaments";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getGameBrand } from "@/lib/gameLogos";
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
        <div className="flex flex-col w-full max-w-7xl mx-auto">
            {/* Hero header */}
            <section className="mx-4 lg:mx-6 mb-[14px] mt-3">
                <div
                    style={{
                        backgroundColor: "#1A1A1E",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 16,
                        padding: 18,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 120,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {/* Decorative brand glow */}
                    <div
                        style={{
                            position: "absolute",
                            top: -40,
                            right: -40,
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background: brand.color,
                            opacity: 0.06,
                            filter: "blur(60px)",
                            pointerEvents: "none",
                        }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, position: "relative", zIndex: 1 }}>
                        {/* Game logo */}
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 14,
                                overflow: "hidden",
                                border: `2px solid ${brand.color}40`,
                                flexShrink: 0,
                                backgroundColor: "#222226",
                            }}
                        >
                            {game.logo_url ? (
                                <Image
                                    src={game.logo_url}
                                    alt={`Logo de ${game.name}`}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-contain p-1.5"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center font-black text-lg"
                                    style={{ background: brand.bg, color: brand.color }}
                                >
                                    {game.short_name || game.slug.toUpperCase().slice(0, 3)}
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Badge */}
                            <span
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    paddingLeft: 10,
                                    paddingRight: 10,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                    borderRadius: 999,
                                    marginBottom: 8,
                                    color: "#888891",
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            >
                                Detalle del juego
                            </span>
                            <h1
                                style={{
                                    color: "#F2F2F2",
                                    fontSize: 22,
                                    fontWeight: 800,
                                    margin: 0,
                                    marginBottom: 4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {game.name}
                            </h1>
                            <p
                                style={{
                                    color: "#888891",
                                    fontSize: 13,
                                    lineHeight: "18px",
                                    margin: 0,
                                }}
                            >
                                {game.publisher || `Torneos, rankings y comunidades de ${game.name}.`}
                            </p>
                        </div>
                    </div>

                    {/* Stats pills */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12, position: "relative", zIndex: 1 }}>
                        <div
                            style={{
                                backgroundColor: "#222226",
                                borderRadius: 12,
                                padding: "8px 14px",
                                border: "1px solid rgba(255,255,255,0.06)",
                                textAlign: "center",
                            }}
                        >
                            <p style={{ fontSize: 10, color: "#888891", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: 2 }}>Formatos</p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#F2F2F2", margin: 0 }}>{formats.length}</p>
                        </div>
                        <div
                            style={{
                                backgroundColor: "#222226",
                                borderRadius: 12,
                                padding: "8px 14px",
                                border: "1px solid rgba(255,255,255,0.06)",
                                textAlign: "center",
                            }}
                        >
                            <p style={{ fontSize: 10, color: "#888891", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: 2 }}>Torneos</p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#F2F2F2", margin: 0 }}>{tournaments.length}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tab navigation + content */}
            <div className="mx-4 lg:mx-6 mb-12">
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
