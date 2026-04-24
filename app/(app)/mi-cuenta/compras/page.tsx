import type { Metadata } from "next";
import OrdersClient from "@/app/(app)/marketplace/orders/OrdersClient";

export const metadata: Metadata = {
    title: "Mis compras",
    description: "Ordenes y compras realizadas en el marketplace de Rankeao.",
    robots: { index: false, follow: false },
};

export default function ComprasPage() {
    return <OrdersClient />;
}
