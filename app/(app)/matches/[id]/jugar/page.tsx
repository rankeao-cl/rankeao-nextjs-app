import { Metadata } from "next";
import PlayLifeCounter from "@/features/play/PlayLifeCounter/PlayLifeCounter";

export const metadata: Metadata = {
    title: "Partida en curso | Rankeao",
    description: "Life Counter MTG — partida en curso",
};

export const dynamic = "force-dynamic";

interface JugarPageProps {
    params: Promise<{ id: string }>;
}

export default async function JugarPage({ params }: JugarPageProps) {
    const { id: partidaId } = await params;
    return <PlayLifeCounter partidaId={partidaId} />;
}
