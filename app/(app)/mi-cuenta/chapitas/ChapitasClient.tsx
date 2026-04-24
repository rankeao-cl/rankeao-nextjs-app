"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react/spinner";
import { ShoppingCart, TriangleExclamation } from "@gravity-ui/icons";

import ChapitaHash from "@/components/promotions/ChapitaHash";
import { useMyChapitas } from "@/lib/hooks/use-promotions";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mapErrorMessage } from "@/lib/api/errors";
import type { Chapita } from "@/lib/types/promotions";

function formatDateTime(value: string | undefined): string {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

function ChapitaRow({ chapita }: { chapita: Chapita }) {
    const img = chapita.promotion_art_url;
    const title = chapita.promotion_title ?? "Promocion";
    const orderHref = chapita.order_public_id
        ? `/mi-cuenta/compras/${chapita.order_public_id}`
        : chapita.order_id
          ? `/mi-cuenta/compras/${chapita.order_id}`
          : null;

    return (
        <Card className="border border-border bg-background">
            <Card.Content className="p-4">
                <div className="flex items-center gap-4">
                    {img ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                            <Image
                                src={img}
                                alt={title}
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface text-2xl">
                            🎟️
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            {chapita.promotion_slug ? (
                                <Link
                                    href={`/promociones/${chapita.promotion_slug}`}
                                    className="truncate text-sm font-bold text-foreground hover:underline"
                                >
                                    {title}
                                </Link>
                            ) : (
                                <p className="truncate text-sm font-bold text-foreground">{title}</p>
                            )}
                            {chapita.serial_number != null && (
                                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">
                                    #{chapita.serial_number}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                            <span>Minteada el {formatDateTime(chapita.minted_at ?? chapita.created_at)}</span>
                            {orderHref && (
                                <Link
                                    href={orderHref}
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    Ver orden
                                </Link>
                            )}
                        </div>

                        <div className="mt-2">
                            <ChapitaHash hash={chapita.chapita_hash} />
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-border bg-background p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                <ShoppingCart className="size-6 text-muted" />
            </div>
            <h2 className="text-base font-bold text-foreground">Aun no tienes chapitas</h2>
            <p className="mt-2 text-sm text-muted">
                Compra en el marketplace durante una promocion activa para ganar chapitas
                digitales y participar automaticamente en los sorteos.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <Link
                    href="/marketplace"
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-[var(--accent)]"
                >
                    Ir al marketplace
                </Link>
                <Link
                    href="/promociones"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                    Ver promociones activas
                </Link>
            </div>
        </div>
    );
}

export default function ChapitasClient() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    const hasHydrated = useAuthStore((s) => s._hasHydrated);
    const query = useMyChapitas();

    if (!hasHydrated) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner />
            </div>
        );
    }

    if (!isAuthed) {
        return (
            <div className="rounded-2xl border border-border bg-background p-8 text-center">
                <h2 className="text-base font-bold text-foreground">Inicia sesion</h2>
                <p className="mt-2 text-sm text-muted">
                    Para ver tus chapitas necesitas iniciar sesion en Rankeao.
                </p>
                <Link
                    href="/login"
                    className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                    Iniciar sesion
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <header className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-extrabold text-foreground">Mis chapitas</h1>
                    <p className="mt-1 text-sm text-muted">
                        Cada chapita es una entrada verificable a los sorteos Rankeao.
                    </p>
                </div>
            </header>

            {query.isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner />
                </div>
            ) : query.isError ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--danger,#ef4444)]/30 bg-[var(--danger,#ef4444)]/10 p-4 text-sm text-foreground">
                    <TriangleExclamation className="size-5 text-[var(--danger,#ef4444)] shrink-0" />
                    <span>{mapErrorMessage(query.error)}</span>
                </div>
            ) : !query.data || query.data.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="flex flex-col gap-3">
                    {query.data.map((c) => (
                        <ChapitaRow key={c.id ?? c.chapita_hash} chapita={c} />
                    ))}
                </div>
            )}
        </div>
    );
}
