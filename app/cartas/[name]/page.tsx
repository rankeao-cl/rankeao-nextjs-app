import type { Metadata } from "next";
import CartaDetailClient from "./CartaDetailClient";

interface Props {
    params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { name } = await params;
    const decoded = decodeURIComponent(name);
    return {
        title: decoded,
        description: `Detalle de ${decoded} en Rankeao.`,
    };
}

export default async function CartaDetailPage({ params }: Props) {
    const { name } = await params;
    return <CartaDetailClient cardName={decodeURIComponent(name)} />;
}
