import type { Metadata } from "next";
import CartaDetailClient from "@/features/catalog/CartaDetailClient";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const name = slug.replace(/-/g, " ");
    return {
        title: name,
        description: `Detalle de ${name} en Rankeao.`,
    };
}

export default async function CartaDetailPage({ params }: Props) {
    const { slug } = await params;
    return <CartaDetailClient cardName={slug} />;
}
