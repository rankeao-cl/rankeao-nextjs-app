import type { Metadata } from "next";
import VentaDetalleClient from "./VentaDetalleClient";

interface Props {
    params: Promise<{ publicId: string }>;
}

export const metadata: Metadata = {
    title: "Detalle de venta",
    description: "Detalle y estado de tu venta en Rankeao.",
    robots: { index: false, follow: false },
};

export default async function VentaDetallePage({ params }: Props) {
    const { publicId } = await params;
    return <VentaDetalleClient publicId={publicId} />;
}
