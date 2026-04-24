"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react/spinner";
import { toast } from "@heroui/react/toast";
import { Person, TriangleExclamation } from "@gravity-ui/icons";

import SellerOnboardingModal from "@/components/seller/SellerOnboardingModal";
import { useMe, useUpdateMeSeller } from "@/lib/hooks/use-marketplace-v2";
import { mapErrorMessage } from "@/lib/api/errors";

export default function PerfilClient() {
    const me = useMe();
    const updateSeller = useUpdateMeSeller();

    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [sellerDisplayName, setSellerDisplayName] = useState("");
    const [sellerPhone, setSellerPhone] = useState("");

    const isSeller = me.data?.is_seller ?? false;

    // Sincroniza los campos editables cada vez que cambia el /me.
    useEffect(() => {
        if (!me.data?.seller) return;
        setSellerDisplayName(me.data.seller.display_name ?? "");
        setSellerPhone(me.data.seller.phone ?? "");
    }, [me.data?.seller]);

    async function handleSaveSeller(e: React.FormEvent) {
        e.preventDefault();
        try {
            await updateSeller.mutateAsync({
                display_name: sellerDisplayName.trim() || undefined,
                phone: sellerPhone.trim() || undefined,
            });
            toast.success("Datos de vendedor actualizados");
        } catch (err) {
            toast.danger("No se pudo actualizar", { description: mapErrorMessage(err) });
        }
    }

    if (me.isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (me.isError || !me.data) {
        return (
            <Card className="border border-border bg-background">
                <Card.Content className="flex flex-col items-center py-16 text-center">
                    <TriangleExclamation className="mb-3 h-10 w-10 text-muted" />
                    <p className="font-semibold text-foreground">No pudimos cargar tu perfil</p>
                    <p className="mt-1 text-sm text-muted">Intenta nuevamente en unos momentos.</p>
                    <button
                        type="button"
                        onClick={() => me.refetch()}
                        className="mt-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--accent)]"
                    >
                        Reintentar
                    </button>
                </Card.Content>
            </Card>
        );
    }

    const user = me.data;
    const displayName = user.display_name ?? user.username ?? "Tu cuenta";

    return (
        <>
            <div className="flex flex-col gap-4">
                <header className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                        Mi cuenta
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold text-foreground">Mi perfil</h1>
                </header>

                {/* Info basica */}
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">
                            Datos personales
                        </p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-5 border-t border-border pt-4">
                        <div className="flex items-center gap-4">
                            {user.avatar_url ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface">
                                    <Image
                                        src={user.avatar_url}
                                        alt={displayName}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface"
                                    aria-hidden
                                >
                                    <Person className="h-7 w-7 text-muted" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-extrabold text-foreground truncate">
                                    {displayName}
                                </p>
                                {user.username && user.display_name && (
                                    <p className="text-xs text-muted truncate">@{user.username}</p>
                                )}
                                {user.email && (
                                    <p className="mt-1 text-xs text-muted truncate">{user.email}</p>
                                )}
                                {user.phone && (
                                    <p className="text-xs text-muted truncate">{user.phone}</p>
                                )}
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Seller */}
                {isSeller ? (
                    <Card className="border border-border bg-background">
                        <Card.Header className="px-5 pt-4 pb-2">
                            <p className="text-xs font-bold text-muted uppercase tracking-wider">
                                Soy vendedor
                            </p>
                        </Card.Header>
                        <Card.Content className="px-5 pb-5 border-t border-border pt-4">
                            <form onSubmit={handleSaveSeller} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="seller-display-name" className="text-xs font-semibold text-muted">
                                        Nombre publico de vendedor
                                    </label>
                                    <input
                                        id="seller-display-name"
                                        type="text"
                                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                                        value={sellerDisplayName}
                                        onChange={(e) => setSellerDisplayName(e.target.value)}
                                        placeholder="Ej: Cartas de Benja"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="seller-phone" className="text-xs font-semibold text-muted">
                                        Telefono de contacto
                                    </label>
                                    <input
                                        id="seller-phone"
                                        type="tel"
                                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                                        value={sellerPhone}
                                        onChange={(e) => setSellerPhone(e.target.value)}
                                        placeholder="+56 9 1234 5678"
                                    />
                                </div>
                                {user.seller?.rut && (
                                    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
                                        <span className="font-semibold text-foreground">RUT:</span>{" "}
                                        {user.seller.rut}
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isPending={updateSeller.isPending}
                                    >
                                        Guardar cambios
                                    </Button>
                                </div>
                            </form>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card className="border border-dashed border-border bg-transparent">
                        <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
                            <p className="text-sm font-semibold text-foreground">
                                ¿Tambien quieres vender cartas?
                            </p>
                            <p className="max-w-md text-sm text-muted">
                                Activa tu cuenta de vendedor para publicar cartas y cobrar en tu billetera
                                de Rankeao. Tardas menos de un minuto.
                            </p>
                            <Button variant="primary" onPress={() => setOnboardingOpen(true)}>
                                Hacerme vendedor
                            </Button>
                        </Card.Content>
                    </Card>
                )}
            </div>

            <SellerOnboardingModal
                isOpen={onboardingOpen}
                onOpenChange={setOnboardingOpen}
                onSuccess={() => me.refetch()}
            />
        </>
    );
}
