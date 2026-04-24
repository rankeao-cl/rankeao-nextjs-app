import type { Metadata } from "next";
import WalletClient from "./WalletClient";

export const metadata: Metadata = {
    title: "Mi wallet",
    description: "Saldo disponible, reservas y movimientos de tu wallet en Rankeao.",
    robots: { index: false, follow: false },
};

export default function WalletPage() {
    return <WalletClient />;
}
