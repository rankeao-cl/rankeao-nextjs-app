import { getDuel } from "@/lib/api/duels";
import type { Metadata } from "next";
import type { Duel } from "@/lib/types/duel";
import DuelDetailClient from "./DuelDetailClient";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    let duel: Duel | null = null;
    try {
        const res = await getDuel(id).catch(() => null);
        duel = res?.duel ?? null;
    } catch { /* silent */ }
    const title = duel
        ? `${duel.challenger?.username ?? "?"} vs ${duel.opponent?.username ?? "?"}`
        : "Duelo";
    return { title, description: `Detalle del duelo en Rankeao.` };
}

export default async function DuelDetailPage({ params }: Props) {
    const { id } = await params;
    let duel: Duel | null = null;
    try {
        const res = await getDuel(id).catch(() => null);
        duel = res?.duel ?? null;
    } catch { /* silent */ }

    return <DuelDetailClient duelId={id} initialDuel={duel} />;
}
