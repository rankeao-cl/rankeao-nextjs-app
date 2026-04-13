import { Metadata } from "next";
import PartidasListClient from "@/features/play/PartidasListClient/PartidasListClient";

export const metadata: Metadata = {
    title: "Partidas | Rankeao",
    description: "Tus partidas de juego en Rankeao",
};

export const dynamic = "force-dynamic";

export default function PartidasPage() {
    return <PartidasListClient />;
}
