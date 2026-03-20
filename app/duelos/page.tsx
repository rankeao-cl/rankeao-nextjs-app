import { getDuels } from "@/lib/api/duels";
import { getGames } from "@/lib/api/catalog";
import DuelosClient from "./DuelosClient";
import type { Metadata } from "next";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Duel } from "@/lib/types/duel";

interface Props {
    searchParams: Promise<{
        q?: string;
        tab?: string;
        game?: string;
        page?: string;
    }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = await searchParams;
    const q = params.q?.trim();
    return {
        title: q ? `Duelos: ${q}` : "Duelos",
        description: q
            ? `Resultados de duelos para ${q} en Rankeao.`
            : "Desafia a tus amigos o encuentra rivales en partidas casuales 1v1.",
    };
}

export default async function DuelosPage({ searchParams }: Props) {
    const params = await searchParams;
    const tab = params.tab || "active";

    let duelsData;
    try {
        duelsData = await getDuels({
            q: params.q,
            game: params.game,
            page: params.page ? Number(params.page) : undefined,
            per_page: 24,
        }).catch(() => null);
    } catch {
        // silent fail
    }

    const rawDuels = duelsData?.duels;
    const duels: Duel[] = Array.isArray(rawDuels) ? rawDuels : [];

    let gamesData;
    try {
        gamesData = await getGames().catch(() => null);
    } catch {
        // silent fail
    }
    const rawGames = gamesData?.data ?? (gamesData as unknown as { games?: CatalogGame[] })?.games;
    const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];

    return (
        <div className="max-w-7xl mx-auto flex flex-col">
            <DuelosClient
                duels={duels}
                games={games}
                currentTab={tab}
                currentQuery={params.q || ""}
            />
        </div>
    );
}
