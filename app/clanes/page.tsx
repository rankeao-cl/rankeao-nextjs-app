import { getClans } from "@/lib/api/clans";
import type { Clan } from "@/lib/types/clan";
import type { Metadata } from "next";
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
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* Hero — same pattern as torneos/marketplace */}
      <div className="mx-4 lg:mx-6 mt-3 mb-[14px]">
        <div
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 120,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "rgba(255,255,255,0.06)",
                paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                borderRadius: 999, marginBottom: 8,
                color: "#888891", fontSize: 11, fontWeight: 600,
              }}
            >
              Equipos & Clanes
            </span>
            <h1 style={{ color: "#F2F2F2", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Clanes
            </h1>
            <p style={{ color: "#888891", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              Unite a un clan, compite en grupo y representa a tu equipo.
            </p>
          </div>
          <a
            href="/clanes/new"
            style={{
              display: "flex", flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "#3B82F6", borderRadius: 12,
              paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              marginLeft: 12, alignSelf: "center", textDecoration: "none", flexShrink: 0,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Crear</span>
          </a>
        </div>
      </div>

      <ClanesClient initialClans={clans} initialQuery={params.q} />
    </div>
  );
}
