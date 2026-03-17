"use client";

import { useTenants } from "@/lib/hooks/use-tenants";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { MapPin } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";

interface Props {
    gameSlug: string;
    gameName: string;
}

export default function GameCommunities({ gameSlug, gameName }: Props) {
    const { data, isLoading } = useTenants({ q: gameSlug, per_page: 8 });
    const rawTenants = data?.tenants;
    const tenants = Array.isArray(rawTenants) ? rawTenants : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Comunidades de {gameName}</h2>
                <Link href={`/comunidades?game=${gameSlug}`}>
                    <Button variant="secondary" size="sm" className="font-semibold">
                        Ver todas &rarr;
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            ) : tenants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenants.map((tenant) => (
                        <Link key={tenant.id} href={`/comunidades/${tenant.slug}`}>
                            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--border)] bg-[var(--surface-secondary)]">
                                        {tenant.logo_url ? (
                                            <Image
                                                src={tenant.logo_url}
                                                alt={tenant.name}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">
                                                🏪
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                                            {tenant.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5">
                                            {(tenant.city || tenant.region) && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="size-3" />
                                                    {tenant.city || tenant.region}
                                                </span>
                                            )}
                                            {tenant.rating != null && (
                                                <span className="text-[var(--warning)]">★ {tenant.rating.toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {tenant.description && (
                                    <p className="text-xs text-[var(--muted)] mt-2 line-clamp-2">
                                        {tenant.description}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-12 text-center">
                        <p className="text-3xl mb-3 opacity-50">🏘️</p>
                        <p className="text-lg font-medium text-[var(--foreground)]">Sin comunidades</p>
                        <p className="text-sm mt-1 text-[var(--muted)]">
                            Aún no hay comunidades asociadas a {gameName}.
                        </p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}
