"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Tabs } from "@heroui/react/tabs";
import { Spinner } from "@heroui/react/spinner";

import ChapitaHash from "@/components/promotions/ChapitaHash";
import FreeFormEntryForm from "@/components/promotions/FreeFormEntryForm";
import WinnersList from "@/components/promotions/WinnersList";
import { useMyChapitas, useWinners } from "@/lib/hooks/use-promotions";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Promotion } from "@/lib/types/promotions";

function formatDateTime(value: string | undefined): string {
    if (!value) return "Por confirmar";
    try {
        return new Date(value).toLocaleString("es-CL", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

function formatCLP(amount: number | undefined): string {
    if (amount == null) return "—";
    return amount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

interface PromotionDetailClientProps {
    promotion: Promotion;
}

export default function PromotionDetailClient({ promotion }: PromotionDetailClientProps) {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    const isDrawn = promotion.status === "DRAWN" || promotion.status === "DELIVERED";
    const salesOpen = promotion.status === "ACTIVE";

    const winnersQuery = useWinners(isDrawn ? promotion.slug : undefined);
    const myChapitasQuery = useMyChapitas();

    const myChapitasForPromo = useMemo(() => {
        const all = myChapitasQuery.data ?? [];
        return all.filter((c) => c.promotion_slug === promotion.slug);
    }, [myChapitasQuery.data, promotion.slug]);

    const img = promotion.art_url ?? promotion.image_url;
    const remaining =
        promotion.edition_size != null && promotion.minted_count != null
            ? Math.max(0, promotion.edition_size - promotion.minted_count)
            : null;

    return (
        <div className="mx-auto max-w-5xl px-4 lg:px-6 py-6">
            {/* Hero */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-surface">
                    {img ? (
                        <Image
                            src={img}
                            alt={promotion.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-6xl text-muted">
                            🎟️
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <span className="self-start rounded-full bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Chapita + sorteo
                    </span>
                    <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
                        {promotion.title}
                    </h1>
                    {promotion.description && (
                        <p className="text-sm text-muted whitespace-pre-line">
                            {promotion.description}
                        </p>
                    )}

                    <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-background p-3">
                            <p className="text-[11px] uppercase tracking-wider text-muted">
                                Fecha del sorteo
                            </p>
                            <p className="mt-1 text-sm font-bold text-foreground">
                                {formatDateTime(promotion.draw_at)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3">
                            <p className="text-[11px] uppercase tracking-wider text-muted">
                                Precio chapita
                            </p>
                            <p className="mt-1 text-sm font-bold text-foreground">
                                {formatCLP(promotion.price)}
                            </p>
                        </div>
                        {promotion.prize && (
                            <div className="col-span-2 rounded-xl border border-border bg-background p-3">
                                <p className="text-[11px] uppercase tracking-wider text-muted">
                                    Premio
                                </p>
                                <p className="mt-1 text-sm font-bold text-foreground">
                                    {promotion.prize}
                                </p>
                            </div>
                        )}
                        {remaining != null && (
                            <div className="col-span-2 rounded-xl border border-border bg-surface/40 p-3 text-[11px] text-muted">
                                {remaining > 0 ? (
                                    <>
                                        Quedan <strong className="text-foreground">{remaining.toLocaleString("es-CL")}</strong>{" "}
                                        chapitas disponibles de {promotion.edition_size?.toLocaleString("es-CL")}.
                                    </>
                                ) : (
                                    <>Edicion agotada.</>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ganadores (si ya se sorteo) */}
            {isDrawn && (
                <section className="mt-8">
                    <h2 className="mb-3 text-lg font-bold text-foreground">Resultado del sorteo</h2>
                    {winnersQuery.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Spinner />
                        </div>
                    ) : (
                        <WinnersList
                            winners={winnersQuery.data ?? []}
                            drawAt={promotion.draw_at}
                        />
                    )}
                </section>
            )}

            {/* Como participar */}
            <section className="mt-10">
                <h2 className="mb-3 text-lg font-bold text-foreground">Como participar</h2>

                <Tabs variant="secondary" className="w-full relative">
                    <Tabs.ListContainer>
                        <Tabs.List
                            aria-label="Metodos de participacion"
                            className="w-full relative border-b border-[var(--border)] pb-0 rounded-none bg-transparent"
                        >
                            <Tabs.Tab id="purchase">
                                <div className="flex items-center gap-2">
                                    🛒 <span>Con compra</span>
                                </div>
                                <Tabs.Indicator className="bg-[var(--accent)]" />
                            </Tabs.Tab>
                            <Tabs.Tab id="free-form">
                                <div className="flex items-center gap-2">
                                    ✍️ <span>Sin compra (Ley 19.496)</span>
                                </div>
                                <Tabs.Indicator className="bg-[var(--accent)]" />
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs.ListContainer>

                    <Tabs.Panel id="purchase">
                        <div className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-5">
                            <p className="text-sm text-foreground">
                                Al comprar cualquier publicacion del{" "}
                                <strong>marketplace Rankeao</strong> durante esta promocion, se
                                genera <strong>1 chapita digital</strong> asociada a tu cuenta.
                                Cada chapita es una entrada automatica al sorteo, con hash
                                SHA-256 unico y verificable.
                            </p>

                            {!salesOpen && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
                                    Las ventas de esta promocion estan cerradas. Revisa el resultado del sorteo mas abajo.
                                </div>
                            )}

                            {!isAuthed ? (
                                <p className="text-xs text-muted">
                                    Inicia sesion para ver tus chapitas asociadas a esta promocion.
                                </p>
                            ) : myChapitasQuery.isLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <Spinner size="sm" />
                                    Cargando tus chapitas...
                                </div>
                            ) : myChapitasForPromo.length === 0 ? (
                                <div className="rounded-lg border border-border bg-surface/40 p-3 text-xs text-muted">
                                    Aun no tienes chapitas de esta promocion. Cada compra en el
                                    marketplace durante la vigencia te suma una entrada.
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                        Tus chapitas en esta promocion
                                    </p>
                                    <ul className="space-y-2">
                                        {myChapitasForPromo.map((c) => (
                                            <li
                                                key={c.id ?? c.chapita_hash}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs"
                                            >
                                                <span className="font-mono text-muted">
                                                    {c.serial_number != null
                                                        ? `Serial #${c.serial_number}`
                                                        : "—"}
                                                </span>
                                                <ChapitaHash hash={c.chapita_hash} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Tabs.Panel>

                    <Tabs.Panel id="free-form">
                        <div className="mt-4 rounded-2xl border border-border bg-background p-5">
                            {salesOpen ? (
                                <FreeFormEntryForm slug={promotion.slug} />
                            ) : (
                                <p className="text-sm text-muted">
                                    Las inscripciones sin compra estan cerradas para esta promocion.
                                </p>
                            )}
                        </div>
                    </Tabs.Panel>
                </Tabs>
            </section>
        </div>
    );
}
