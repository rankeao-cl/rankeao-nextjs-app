import type { Metadata } from "next";
import ChapitasClient from "./ChapitasClient";

export const metadata: Metadata = {
    title: "Mis chapitas",
    description: "Historial de chapitas digitales y entradas a sorteos Rankeao.",
    robots: { index: false, follow: false },
};

export default function ChapitasPage() {
    return <ChapitasClient />;
}
