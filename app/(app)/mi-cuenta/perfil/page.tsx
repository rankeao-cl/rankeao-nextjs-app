import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mi perfil",
    description: "Datos personales y configuracion de tu cuenta en Rankeao.",
    robots: { index: false, follow: false },
};

export default function PerfilPage() {
    return (
        <div className="rounded-2xl border border-border bg-background p-6 lg:p-10">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                Mi cuenta
            </p>
            <h1 className="text-2xl font-extrabold text-foreground mt-2 mb-2">
                Mi perfil
            </h1>
            <p className="text-sm text-muted max-w-xl">
                Próximamente vas a poder editar tus datos personales, avatar, preferencias
                y seguridad desde aquí. Por ahora puedes seguir usando{" "}
                <span className="text-foreground font-semibold">/config</span> y{" "}
                <span className="text-foreground font-semibold">/perfil/me</span>.
            </p>
        </div>
    );
}
