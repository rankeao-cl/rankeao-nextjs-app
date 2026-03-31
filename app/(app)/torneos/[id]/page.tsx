import { getTournament } from "@/lib/api/tournaments";
import TournamentDetailClient from "./TournamentDetailClient";
import { Card } from "@heroui/react";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    try {
        const { tournament } = await getTournament(id);
        return {
            title: tournament?.name || "Torneo",
            description: tournament?.description || `Detalle del torneo en Rankeao.`,
        };
    } catch {
        return { title: "Torneo" };
    }
}

export default async function TournamentDetailPage({ params }: Props) {
    const { id } = await params;

    let tournament = null;
    let error = false;

    try {
        const res = await getTournament(id);
        tournament = res.tournament;
    } catch {
        error = true;
    }

    if (error || !tournament) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12">
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-16 text-center">
                        <p className="text-4xl mb-4">404</p>
                        <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                            Torneo no encontrado
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                            El torneo que buscas no existe o fue eliminado.
                        </p>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    return <TournamentDetailClient tournament={tournament} />;
}
