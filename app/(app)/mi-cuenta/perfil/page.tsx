import type { Metadata } from "next";
import PerfilClient from "./PerfilClient";

export const metadata: Metadata = {
    title: "Mi perfil",
    description: "Datos personales y configuracion de tu cuenta en Rankeao.",
    robots: { index: false, follow: false },
};

export default function PerfilPage() {
    return <PerfilClient />;
}
