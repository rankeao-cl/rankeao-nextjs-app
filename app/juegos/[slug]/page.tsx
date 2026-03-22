import { getGameDetail, getGameFormats, getGameSets } from "@/lib/api/catalog";
import { getTournaments } from "@/lib/api/tournaments";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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

    const [gameDetailRes, formatsRes, tournamentsData, setsData] = await Promise.all([
        getGameDetail(slug).catch(() => null),
        getGameFormats(slug).catch(() => null),
        getTournaments({ game: slug, per_page: 6 }).catch(() => null),
        getGameSets(slug, { per_page: 1 }).catch(() => null),
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
    const rankedCount = formats.filter((f: any) => f.is_ranked).length;
    const setsCount = (setsData as any)?.meta?.total ?? 0;

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto">
            {/* ── Hero header — comunidades style with brand gradient ── */}
            <section className="mx-4 lg:mx-6 mb-[14px] mt-3">
                <div style={{
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.06)",
                    overflow: "hidden",
                    position: "relative",
                }}>
                    {/* Banner gradient */}
                    <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand.bg || "#0f172a"}, #1A1A1E)` }} />
                        {/* Brand glow */}
                        <div style={{ position: "absolute", top: -20, right: -20, width: 200, height: 200, borderRadius: "50%", background: brand.color, opacity: 0.08, filter: "blur(60px)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1A1E 0%, rgba(26,26,30,0.4) 60%, rgba(0,0,0,0.1) 100%)" }} />

                        {/* Floating badges */}
                        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 4 }}>
                            {formats.length > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: brand.color, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    {formats.length} formato{formats.length !== 1 ? "s" : ""}
                                </span>
                            )}
                            {rankedCount > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#EAB308", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    {rankedCount} ranked
                                </span>
                            )}
                        </div>

                        {/* Logo + Name on banner */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 18px 16px", display: "flex", alignItems: "flex-end", gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                border: "3px solid #1A1A1E", backgroundColor: "#222226", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                            }}>
                                {game.logo_url ? (
                                    <Image src={game.logo_url} alt={game.name} width={64} height={64} className="w-full h-full object-contain p-1.5" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-lg" style={{ background: brand.bg, color: brand.color }}>
                                        {game.short_name || game.slug.toUpperCase().slice(0, 3)}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, marginBottom: 4 }}>
                                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {game.name}
                                </h1>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>
                                    {game.publisher || "Juego de cartas coleccionables"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats row below banner */}
                    <div style={{
                        backgroundColor: "#1A1A1E",
                        display: "flex", alignItems: "center",
                        padding: "12px 18px", gap: 4,
                    }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 800, color: brand.color, margin: 0 }}>{formats.length}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Formatos</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "#EAB308", margin: 0 }}>{rankedCount}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Ranked</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{tournaments.length}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Torneos</p>
                        </div>
                        {setsCount > 0 && (<>
                            <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)" }} />
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: 16, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{setsCount}</p>
                                <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Sets</p>
                            </div>
                        </>)}
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
