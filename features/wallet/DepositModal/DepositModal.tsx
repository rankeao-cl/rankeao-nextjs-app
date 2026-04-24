"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Input } from "@heroui/react/input";
import {
    Xmark,
    CreditCard,
    CircleInfo,
    TriangleExclamation,
} from "@gravity-ui/icons";

import { useUIStore } from "@/lib/stores/ui-store";
import { useCreateDeposit } from "@/lib/hooks/use-wallet";
import { labelForProvider } from "@/features/wallet/shared";
import { ApiError } from "@/lib/api/errors";
import type { PaymentProviderCode } from "@/lib/types/wallet";

const PROVIDERS: Array<{ value: PaymentProviderCode; label: string }> = [
    { value: "flow", label: "Flow" },
    { value: "webpay", label: "Webpay" },
    { value: "mercadopago", label: "Mercado Pago" },
];

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 500_000;

function generateIdempotenceKey(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `dep-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Wrapper mounts/unmounts the inner dialog, giving us a clean
 * state reset (and a fresh idempotence key) on every open.
 */
export default function DepositModal() {
    const isOpen = useUIStore((s) => s.depositModalOpen);
    if (!isOpen) return null;
    return <DepositDialog />;
}

function DepositDialog() {
    const onClose = useUIStore((s) => s.closeDepositModal);
    const createDeposit = useCreateDeposit();

    // Lazy initialisers run once on mount — no cascading setState in an effect.
    const [amount, setAmount] = useState<string>("10000");
    const [provider, setProvider] = useState<PaymentProviderCode>("flow");
    const [idempotenceKey] = useState<string>(() => generateIdempotenceKey());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [providerOffline, setProviderOffline] = useState<PaymentProviderCode | null>(null);

    // Escape closes the modal when not submitting.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !createDeposit.isPending) onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose, createDeposit.isPending]);

    // Lock body scroll while open.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const amountNum = useMemo(() => {
        const n = parseInt(amount, 10);
        return Number.isFinite(n) ? n : 0;
    }, [amount]);

    const amountError = useMemo(() => {
        if (!amount) return null;
        if (amountNum < MIN_AMOUNT) return `Monto mínimo: $${MIN_AMOUNT.toLocaleString("es-CL")}`;
        if (amountNum > MAX_AMOUNT) return `Monto máximo: $${MAX_AMOUNT.toLocaleString("es-CL")}`;
        return null;
    }, [amount, amountNum]);

    const canSubmit =
        !createDeposit.isPending &&
        amountNum >= MIN_AMOUNT &&
        amountNum <= MAX_AMOUNT &&
        !!provider &&
        !!idempotenceKey;

    async function handleSubmit() {
        if (!canSubmit) return;
        setErrorMessage(null);
        setProviderOffline(null);

        try {
            const res = await createDeposit.mutateAsync({
                provider_code: provider,
                amount: String(amountNum),
                currency: "CLP",
                idempotence_key: idempotenceKey,
            });
            if (res.redirect_url) {
                window.location.href = res.redirect_url;
                return;
            }
            // No redirect URL — unusual but treat as success fallback.
            onClose();
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                // Provider not configured / not implemented → show friendly banner.
                if (err.status === 501 || err.code === "NOT_IMPLEMENTED") {
                    setProviderOffline(provider);
                    return;
                }
                if (
                    err.status === 400 &&
                    (err.code === "BAD_REQUEST" || /no active config/i.test(err.message))
                ) {
                    setProviderOffline(provider);
                    return;
                }
                if (err.status === 409) {
                    setErrorMessage("Ya existe una recarga pendiente con esta referencia.");
                    return;
                }
                setErrorMessage(err.message || "No pudimos iniciar la recarga. Intenta más tarde.");
                return;
            }
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "No pudimos iniciar la recarga. Intenta más tarde.",
            );
        }
    }

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Recargar saldo"
        >
            <button
                type="button"
                aria-label="Cerrar recargar saldo"
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                    if (!createDeposit.isPending) onClose();
                }}
            />
            <Card
                className="surface-card relative z-10 w-full max-w-md mx-4 rounded-2xl"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <Card.Content className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/15 text-accent">
                                <CreditCard className="size-4" />
                            </div>
                            <h2 className="text-lg font-bold m-0 text-[var(--foreground)]">
                                Recargar saldo
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!createDeposit.isPending) onClose();
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-foreground/5"
                            style={{ color: "var(--muted)" }}
                            aria-label="Cerrar"
                            disabled={createDeposit.isPending}
                        >
                            <Xmark style={{ width: 16, height: 16 }} />
                        </button>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                        <label
                            htmlFor="deposit-amount"
                            className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider"
                        >
                            Monto a recargar (CLP)
                        </label>
                        <Input
                            id="deposit-amount"
                            aria-label="Monto a recargar en pesos chilenos"
                            type="number"
                            inputMode="numeric"
                            min={MIN_AMOUNT}
                            max={MAX_AMOUNT}
                            step={1000}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ej: 10000 (mínimo ${MIN_AMOUNT.toLocaleString("es-CL")})`}
                        />
                        <p className="text-[11px] m-0" style={{ color: "var(--muted)" }}>
                            Rango permitido: ${MIN_AMOUNT.toLocaleString("es-CL")} — ${MAX_AMOUNT.toLocaleString("es-CL")} CLP
                        </p>
                        {amountError && (
                            <p className="text-[11px] m-0" style={{ color: "#b53000" }}>
                                {amountError}
                            </p>
                        )}
                    </div>

                    {/* Provider */}
                    <div className="space-y-1">
                        <label
                            htmlFor="deposit-provider"
                            className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider"
                        >
                            Pasarela de pago
                        </label>
                        <select
                            id="deposit-provider"
                            aria-label="Selecciona una pasarela de pago"
                            value={provider}
                            onChange={(e) => {
                                setProvider(e.target.value as PaymentProviderCode);
                                setProviderOffline(null);
                                setErrorMessage(null);
                            }}
                            className="w-full h-10 rounded-xl px-3 text-sm font-medium"
                            style={{
                                backgroundColor: "var(--surface-solid)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                            }}
                        >
                            {PROVIDERS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Provider offline banner */}
                    {providerOffline && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl p-3"
                            style={{
                                backgroundColor: "rgba(245,158,11,0.12)",
                                border: "1px solid rgba(245,158,11,0.35)",
                                color: "#92400e",
                            }}
                        >
                            <TriangleExclamation className="size-4 mt-0.5 shrink-0" />
                            <p className="text-[12px] leading-relaxed m-0">
                                La pasarela <strong>{labelForProvider(providerOffline)}</strong> aún no está habilitada.
                                Estamos trabajando en su activación.
                            </p>
                        </div>
                    )}

                    {/* Generic error */}
                    {errorMessage && !providerOffline && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl p-3"
                            style={{
                                backgroundColor: "rgba(246,61,0,0.1)",
                                border: "1px solid rgba(246,61,0,0.3)",
                                color: "#b53000",
                            }}
                        >
                            <TriangleExclamation className="size-4 mt-0.5 shrink-0" />
                            <p className="text-[12px] leading-relaxed m-0">{errorMessage}</p>
                        </div>
                    )}

                    {/* Beta disclaimer */}
                    <div
                        role="note"
                        className="flex items-start gap-2 rounded-xl p-3 text-[11px] leading-relaxed"
                        style={{
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                            color: "var(--muted)",
                        }}
                    >
                        <CircleInfo className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                            El módulo de pagos está en beta. Si necesitas recargar saldo urgente,
                            escríbenos a <strong>soporte@rankeao.cl</strong>.
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="tertiary"
                            className="flex-1"
                            onPress={onClose}
                            isDisabled={createDeposit.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 font-semibold"
                            onPress={handleSubmit}
                            isPending={createDeposit.isPending}
                            isDisabled={!canSubmit}
                        >
                            {createDeposit.isPending ? "Redirigiendo..." : "Ir a pagar"}
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}
