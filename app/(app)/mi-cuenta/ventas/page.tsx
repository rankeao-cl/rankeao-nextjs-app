import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mis ventas",
    description: "Gestiona las ventas realizadas en Rankeao.",
    robots: { index: false, follow: false },
};

export default function VentasPage() {
    return (
        <div className="rounded-2xl border border-border bg-background p-6 lg:p-10">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                Mi cuenta
            </p>
            <h1 className="text-2xl font-extrabold text-foreground mt-2 mb-2">
                Mis ventas
            </h1>
            <p className="text-sm text-muted max-w-xl">
                Próximamente vas a poder ver y gestionar desde aquí todas las ventas que
                hagas en el marketplace de Rankeao: ordenes por cobrar, enviadas, pagadas
                y disputas. Estamos trabajando en esta vista.
            </p>
        </div>
    );
}
