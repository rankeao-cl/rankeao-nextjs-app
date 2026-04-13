import { Metadata } from "next";
import PartidaLobbyClient from "@/features/play/PartidaLobbyClient/PartidaLobbyClient";

export const metadata: Metadata = {
    title: "Lobby | Rankeao",
    description: "Sala de espera de la partida",
};

export const dynamic = "force-dynamic";

interface PartidaPageProps {
    params: Promise<{ id: string }>;
}

export default async function PartidaPage({ params }: PartidaPageProps) {
    const { id } = await params;
    return <PartidaLobbyClient partidaId={id} />;
}
