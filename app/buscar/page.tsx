"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, Spinner, Tabs, Card } from "@heroui/react";
import { Magnifier, Person, Cup, Persons, ShoppingCart } from "@gravity-ui/icons";
import Link from "next/link";

import { autocompleteUsers } from "@/lib/api/social";
import { getTournaments } from "@/lib/api/tournaments";
import { getTenants } from "@/lib/api/tenants";
import { getListings } from "@/lib/api/marketplace";

type SearchResult = {
  id: string;
  type: "user" | "tournament" | "community" | "listing";
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
};

const TYPE_CONFIG = {
  user: { icon: Person, label: "Jugadores", color: "text-blue-500", bg: "bg-blue-500/15" },
  tournament: { icon: Cup, label: "Torneos", color: "text-purple-500", bg: "bg-purple-500/15" },
  community: { icon: Persons, label: "Comunidades", color: "text-emerald-500", bg: "bg-emerald-500/15" },
  listing: { icon: ShoppingCart, label: "Marketplace", color: "text-orange-500", bg: "bg-orange-500/15" },
} as const;

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const [usersRes, tournamentsRes, tenantsRes, listingsRes] = await Promise.allSettled([
          autocompleteUsers(query),
          getTournaments({ q: query, per_page: 20 }),
          getTenants({ q: query, per_page: 20 }),
          getListings({ q: query, per_page: 20 }),
        ]);

        const items: SearchResult[] = [];

        if (usersRes.status === "fulfilled") {
          const val = usersRes.value as any;
          const users = val?.data?.users || val?.users || (Array.isArray(val) ? val : []);
          users.forEach((u: any) => {
            items.push({
              id: u.id || u.username,
              type: "user",
              title: u.username || u.display_name || "Usuario",
              subtitle: u.display_name && u.display_name !== u.username ? u.display_name : undefined,
              image: u.avatar_url,
              href: `/perfil/${encodeURIComponent(u.username)}`,
            });
          });
        }

        if (tournamentsRes.status === "fulfilled") {
          const val = tournamentsRes.value as any;
          const tournaments = val?.data?.tournaments || val?.tournaments || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
          tournaments.forEach((t: any) => {
            items.push({
              id: t.id,
              type: "tournament",
              title: t.name,
              subtitle: t.game || t.tenant_name || undefined,
              href: `/torneos/${t.id}`,
            });
          });
        }

        if (tenantsRes.status === "fulfilled") {
          const val = tenantsRes.value as any;
          const tenants = val?.data?.tenants || val?.tenants || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
          tenants.forEach((t: any) => {
            items.push({
              id: t.id || t.slug,
              type: "community",
              title: t.name,
              subtitle: t.city ? `${t.city}${t.region ? `, ${t.region}` : ""}` : undefined,
              image: t.logo_url,
              href: `/comunidades/${t.slug}`,
            });
          });
        }

        if (listingsRes.status === "fulfilled") {
          const val = listingsRes.value as any;
          const listings = val?.data?.listings || val?.listings || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
          listings.forEach((l: any) => {
            items.push({
              id: l.id,
              type: "listing",
              title: l.title || l.card_name || "Producto",
              subtitle: l.price ? `$${Number(l.price).toLocaleString("es-CL")}` : undefined,
              image: l.images?.[0] || l.image_url,
              href: `/marketplace/${l.id}`,
            });
          });
        }

        setResults(items);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center mb-6">
          <Magnifier className="size-8 text-[var(--muted)]" />
        </div>
        <h1 className="text-2xl font-black font-reddit mb-2 lowercase">Busca algo increíble</h1>
        <p className="text-[var(--muted)]">Escribe en la barra de arriba para empezar tu búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="rk-container py-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-black font-reddit lowercase mb-2">
          Resultados para <span className="text-[var(--brand)]">&quot;{query}&quot;</span>
        </h1>
        <p className="text-[var(--muted)] text-sm">
          Encontramos {results.length} coincidencias en toda la plataforma.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="warning" />
        </div>
      ) : results.length > 0 ? (
        <Tabs
          aria-label="Filtros de búsqueda"
          variant="primary"
        >
          <Tabs.ListContainer className="border-b border-[var(--border)]">
            <Tabs.List className="gap-6 w-full relative p-0" aria-label="Filtros de búsqueda">
              <Tabs.Tab id="all" className="max-w-fit px-0 h-12 flex items-center space-x-2 font-bold text-sm">
                <span>Todo</span>
                <span className="text-[10px] bg-[var(--surface-tertiary)] px-1.5 py-0.5 rounded-full">{results.length}</span>
                <Tabs.Indicator className="bg-[var(--brand)]" />
              </Tabs.Tab>
              {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
                const items = groupedResults[type] || [];
                if (items.length === 0) return null;
                return (
                  <Tabs.Tab key={type} id={type} className="max-w-fit px-0 h-12 flex items-center space-x-2 font-bold text-sm">
                    <span>{TYPE_CONFIG[type].label}</span>
                    <span className="text-[10px] bg-[var(--surface-tertiary)] px-1.5 py-0.5 rounded-full">{items.length}</span>
                    <Tabs.Indicator className="bg-[var(--brand)]" />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {results.map((item) => (
                <ResultCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </Tabs.Panel>

          {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
            const items = groupedResults[type] || [];
            if (items.length === 0) return null;
            return (
              <Tabs.Panel key={type} id={type}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {items.map((item) => (
                    <ResultCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              </Tabs.Panel>
            );
          })}
        </Tabs>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-lg font-bold text-[var(--foreground)] mb-2">No hubo suerte esta vez</p>
          <p className="text-[var(--muted)]">Prueba con otras palabras o revisa que todo esté bien escrito.</p>
        </div>
      )}
    </div>
  );
}

function ResultCard({ item }: { item: SearchResult }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <Link href={item.href}>
      <Card
        className="w-full border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/30 transition-all shadow-sm hover:shadow-md"
      >
        <Card.Content className="flex items-center gap-4 p-4">
          {item.image ? (
            <Avatar className="w-12 h-12 shrink-0 rounded-xl">
              <Avatar.Image src={item.image} alt={item.title} />
              <Avatar.Fallback className="text-xl font-reddit">{item.title[0]}</Avatar.Fallback>
            </Avatar>
          ) : (
            <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-6 ${config.color}`} />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                {config.label === "Marketplace" ? "Venta" : config.label.slice(0, -1)}
              </span>
            </div>
            <h3 className="font-bold text-[var(--foreground)] truncate leading-tight">{item.title}</h3>
            {item.subtitle && (
              <p className="text-xs text-[var(--muted)] truncate mt-0.5">{item.subtitle}</p>
            )}
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="warning" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
