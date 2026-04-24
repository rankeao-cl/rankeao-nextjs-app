import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import PromotionCard from "@/components/promotions/PromotionCard";
import { fetchPromotions } from "@/lib/api/promotions";

export const metadata: Metadata = {
    title: "Promociones",
    description:
        "Compra chapitas de edicion limitada y participa automaticamente en sorteos. Tambien puedes inscribirte gratis segun la Ley 19.496.",
};

export const revalidate = 60;

export default async function PromocionesPage() {
    let promotions: Awaited<ReturnType<typeof fetchPromotions>> = [];
    let errored = false;
    try {
        promotions = await fetchPromotions();
    } catch {
        errored = true;
    }

    return (
        <div>
            <PageHero
                badge="Sorteos"
                title="Promociones Rankeao"
                subtitle="Chapitas de edicion limitada. Cada compra genera una entrada al sorteo. Tambien puedes inscribirte sin compra."
            />

            <div className="mx-4 lg:mx-6 mt-2">
                {errored && (
                    <div className="mb-4 rounded-xl border border-[var(--danger,#ef4444)]/30 bg-[var(--danger,#ef4444)]/10 p-4 text-sm text-foreground">
                        No pudimos cargar las promociones activas. Intenta nuevamente mas tarde.
                    </div>
                )}

                {!errored && promotions.length === 0 && (
                    <div className="rounded-2xl border border-border bg-background p-10 text-center">
                        <div className="mx-auto mb-3 text-5xl">🎟️</div>
                        <h2 className="text-lg font-bold text-foreground">
                            No hay promociones activas
                        </h2>
                        <p className="mt-2 text-sm text-muted">
                            Vuelve pronto. Publicamos nuevas chapitas y sorteos con regularidad.
                        </p>
                    </div>
                )}

                {promotions.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {promotions.map((p) => (
                            <PromotionCard key={p.slug} promotion={p} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
