import type { Metadata } from "next";
import CreateTournamentForm from "./CreateTournamentForm";

export const metadata: Metadata = {
    title: "Crear Torneo",
    description: "Crea un nuevo torneo TCG en Rankeao.",
};

export default function CreateTournamentPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
                Crear Torneo
            </h1>
            <CreateTournamentForm />
        </div>
    );
}
