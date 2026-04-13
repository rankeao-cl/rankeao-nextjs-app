import { Metadata } from "next";
import LifeCounterClient from "./LifeCounterClient";

export const metadata: Metadata = {
    title: "Life Counter | Rankeao",
    description: "Partida en curso — Life Counter MTG",
};

// Sin padding ni navbar para esta ruta — pantalla completa
export const dynamic = "force-dynamic";

interface SessionPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ duelId?: string; game?: string }>;
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
    const { id: sessionId } = await params;
    const { duelId, game } = await searchParams;

    // duelId y game pueden venir como query params si se navega desde el duel detail
    // El sessionId también puede actuar como duelId en modo host_mode (sin duel)
    const resolvedDuelId = duelId ?? sessionId;
    const gameNumber = game ? parseInt(game, 10) : 1;

    return (
        <LifeCounterClient
            duelId={resolvedDuelId}
            gameNumber={gameNumber}
            sessionId={sessionId}
        />
    );
}
