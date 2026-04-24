import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PromotionDetailClient from "./PromotionDetailClient";
import { fetchPromotion } from "@/lib/api/promotions";

interface PromocionDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PromocionDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const promo = await fetchPromotion(slug);
        if (!promo) {
            return { title: "Promocion no encontrada" };
        }
        return {
            title: promo.title,
            description:
                promo.description ??
                `Participa en el sorteo de ${promo.title} comprando una chapita o inscribiendote gratis.`,
        };
    } catch {
        return { title: "Promocion" };
    }
}

export const revalidate = 60;

export default async function PromocionDetailPage({ params }: PromocionDetailPageProps) {
    const { slug } = await params;

    let promo: Awaited<ReturnType<typeof fetchPromotion>> = null;
    try {
        promo = await fetchPromotion(slug);
    } catch {
        promo = null;
    }

    if (!promo) {
        notFound();
    }

    return <PromotionDetailClient promotion={promo} />;
}
