import type { Metadata } from "next";
import VentasClient from "./VentasClient";

export const metadata: Metadata = {
    title: "Mis ventas",
    description: "Gestiona las ventas realizadas en el marketplace de Rankeao.",
    robots: { index: false, follow: false },
};

export default function VentasPage() {
    return <VentasClient />;
}
