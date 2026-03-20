import { getClans } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";
import type { Metadata } from "next";
import { Card, Chip } from "@heroui/react";
import ClanesClient from "./ClanesClient";

export const metadata: Metadata = {
  title: "Clanes",
  description: "Explora y únete a clanes de la comunidad TCG en Rankeao.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClanesPage({ searchParams }: Props) {
  const params = await searchParams;
  let clans: Clan[] = [];

  try {
    const data = await getClans({
      search: params.q,
      per_page: 30,
    }).catch(() => null);
    const raw = (data as any)?.data?.clans ?? (data as any)?.clans ?? (data as any)?.data;
    clans = Array.isArray(raw) ? raw : [];
  } catch {
    // silent
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <section>
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Equipos & Clanes
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Clanes
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg">
              Únete a un clan, compite en grupo y representa a tu equipo en torneos.
            </p>
          </div>
        </div>
      </section>

      <ClanesClient initialClans={clans} initialQuery={params.q} />
    </div>
  );
}
