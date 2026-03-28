import type { Metadata } from "next";
import CartasClient from "./CartasClient";

export const metadata: Metadata = {
    title: "Buscar Cartas",
    description: "Busca cartas de Magic: The Gathering en el catálogo de Rankeao.",
};

export default function CartasPage() {
    return <CartasClient />;
}
