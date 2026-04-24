import type { Metadata } from "next";
import CompraDetalleClient from "./CompraDetalleClient";

interface Props {
    params: Promise<{ publicId: string }>;
}

export const metadata: Metadata = {
    title: "Detalle de compra",
    description: "Detalle y estado de tu orden en Rankeao.",
    robots: { index: false, follow: false },
};

export default async function CompraDetallePage({ params }: Props) {
    const { publicId } = await params;
    return <CompraDetalleClient publicId={publicId} />;
}
