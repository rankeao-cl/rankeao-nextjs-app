import { Metadata } from "next";
import { redirect } from "next/navigation";
import LifeCounterSetupClient from "./LifeCounterSetupClient";

export const metadata: Metadata = {
    title: "Life Counter | Rankeao",
    description: "Contador de vida para Magic: The Gathering",
};

interface DuelsPageProps {
    searchParams: Promise<{ duelId?: string }>;
}

export default async function DuelsPage({ searchParams }: DuelsPageProps) {
    const params = await searchParams;
    const linkedDuelId = params.duelId ?? null;

    return <LifeCounterSetupClient linkedDuelId={linkedDuelId} />;
}

export { redirect };
