import type { Metadata } from "next";
import WalletClient from "@/app/(app)/wallet/WalletClient";

export const metadata: Metadata = {
    title: "Mi billetera",
    description: "Saldo disponible, reservas y movimientos de tu billetera en Rankeao.",
    robots: { index: false, follow: false },
};

export default function BilleteraPage() {
    return <WalletClient />;
}
