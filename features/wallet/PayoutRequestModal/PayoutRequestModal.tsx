"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Input } from "@heroui/react/input";
import { TextArea } from "@heroui/react/textarea";
import {
    Xmark,
    ArrowUpFromSquare,
    CircleInfo,
    TriangleExclamation,
    Check,
} from "@gravity-ui/icons";

import { useUIStore } from "@/lib/stores/ui-store";
import { useBalance, useCreatePayout } from "@/lib/hooks/use-wallet";
import { pickAvailableCLP } from "@/features/wallet/shared";
import { formatCurrency } from "@/lib/utils/format";
import { ApiError } from "@/lib/api/errors";

const MIN_AMOUNT = 10_000;
const BANK_DETAILS_PLACEHOLDER = `Banco: (ej. Banco de Chile, BancoEstado, Santander, etc.)
Tipo de Cuenta: (Cuenta Corriente / Cuenta Vista / CuentaRUT)
RUT: 12.345.678-9
Nombre completo del titular:
Número de cuenta:`;

function generateIdempotenceKey(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Wrapper mounts/unmounts the inner dialog, giving us a clean
 * state reset (and a fresh idempotence key) on every open.
 */
export default function PayoutRequestModal() {
    const isOpen = useUIStore((s) => s.payoutModalOpen);
    if (!isOpen) return null;
    return <PayoutDialog />;
}

function PayoutDialog() {
    const onClose = useUIStore((s) => s.closePayoutModal);
    const createPayout = useCreatePayout();

    const { data: balanceData } = useBalance();
    const clp = useMemo(() => pickAvailableCLP(balanceData?.accounts), [balanceData]);
    const availableStr = clp?.available ?? "0";
    const availableNum = useMemo(() => {
        const n = parseFloat(availableStr);
        return Number.isFinite(n) ? n : 0;
    }, [availableStr]);

    const [amount, setAmount] = useState<string>("");
    const [bankDetails, setBankDetails] = useState<string>("");
    const [idempotenceKey] = useState<string>(() => generateIdempotenceKey());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !createPayout.isPending) onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose, createPayout.isPending]);

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
        if (amountNum < MIN_AMOUNT) {
            return `Monto mínimo: $${MIN_AMOUNT.toLocaleString("es-CL")}`;
        }
        if (amountNum > availableNum) {
            return `Saldo insuficiente. Disponible: ${formatCurrency(availableStr, "CLP")}`;
        }
        return null;
    }, [amount, amountNum, availableNum, availableStr]);

    const trimmedDetails = bankDetails.trim();
    const bankDetailsError = useMemo(() => {
        if (!bankDetails) return null;
        if (trimmedDetails.length < 10) {
            return "Describe tus datos bancarios (mínimo 10 caracteres).";
        }
        return null;
    }, [bankDetails, trimmedDetails]);

    const canSubmit =
        !createPayout.isPending &&
        !success &&
        amountNum >= MIN_AMOUNT &&
        amountNum <= availableNum &&
        trimmedDetails.length >= 10 &&
        !!idempotenceKey;

    async function handleSubmit() {
        if (!canSubmit) return;
        setErrorMessage(null);

        try {
            await createPayout.mutateAsync({
                amount: String(amountNum),
                currency: "CLP",
                bank_details: trimmedDetails,
                idempotence_key: idempotenceKey,
            });
            setSuccess(true);
            // Give the user a brief moment to see confirmation before closing.
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setErrorMessage(err.message || "No pudimos crear la solicitud.");
                return;
            }
            setErrorMessage(
                err instanceof Error ? err.message : "No pudimos crear la solicitud.",
            );
        }
    }

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Retirar saldo"
        >
            <button
                type="button"
                aria-label="Cerrar retirar saldo"
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                    if (!createPayout.isPending) onClose();
                }}
            />
            <Card
                className="surface-card relative z-10 w-full max-w-lg mx-4 rounded-2xl"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <Card.Content className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/15 text-accent">
                                <ArrowUpFromSquare className="size-4" />
                            </div>
                            <h2 className="text-lg font-bold m-0 text-[var(--foreground)]">
                                Retirar saldo
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!createPayout.isPending) onClose();
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-foreground/5"
                            style={{ color: "var(--muted)" }}
                            aria-label="Cerrar"
                            disabled={createPayout.isPending}
                        >
                            <Xmark style={{ width: 16, height: 16 }} />
                        </button>
                    </div>

                    {/* Available balance */}
                    <div
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <span
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--muted)" }}
                        >
                            Saldo disponible
                        </span>
                        <span
                            className="text-sm font-extrabold tabular-nums"
                            style={{ color: "var(--foreground)" }}
                        >
                            {formatCurrency(availableStr, "CLP")}
                        </span>
                    </div>

                    {/* Success banner */}
                    {success && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex items-start gap-2 rounded-xl p-3"
                            style={{
                                backgroundColor: "rgba(0,178,75,0.12)",
                                border: "1px solid rgba(0,178,75,0.35)",
                                color: "#00733c",
                            }}
                        >
                            <Check className="size-4 mt-0.5 shrink-0" />
                            <p className="text-[12px] leading-relaxed m-0">
                                Solicitud de retiro enviada. Te contactaremos pronto para confirmar los datos.
                            </p>
                        </div>
                    )}

                    {!success && (
                        <>
                            {/* Amount */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="payout-amount"
                                    className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider"
                                >
                                    Monto a retirar (CLP)
                                </label>
                                <Input
                                    id="payout-amount"
                                    aria-label="Monto a retirar en pesos chilenos"
                                    type="number"
                                    inputMode="numeric"
                                    min={MIN_AMOUNT}
                                    step={1000}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Ej: 40000 (mínimo ${MIN_AMOUNT.toLocaleString("es-CL")})`}
                                />
                                {amountError ? (
                                    <p className="text-[11px] m-0" style={{ color: "#b53000" }}>
                                        {amountError}
                                    </p>
                                ) : (
                                    <p className="text-[11px] m-0" style={{ color: "var(--muted)" }}>
                                        Monto mínimo por retiro: ${MIN_AMOUNT.toLocaleString("es-CL")} CLP
                                    </p>
                                )}
                            </div>

                            {/* Bank details */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="payout-bank"
                                    className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider"
                                >
                                    Datos bancarios
                                </label>
                                <TextArea
                                    id="payout-bank"
                                    aria-label="Datos bancarios para el retiro"
                                    placeholder={BANK_DETAILS_PLACEHOLDER}
                                    value={bankDetails}
                                    onChange={(e) => setBankDetails(e.target.value)}
                                    rows={6}
                                />
                                {bankDetailsError ? (
                                    <p className="text-[11px] m-0" style={{ color: "#b53000" }}>
                                        {bankDetailsError}
                                    </p>
                                ) : (
                                    <p className="text-[11px] m-0" style={{ color: "var(--muted)" }}>
                                        Completa todos los campos del template. Un admin revisará los datos.
                                    </p>
                                )}
                            </div>

                            {/* Info notes */}
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
                                <div className="space-y-1">
                                    <p className="m-0">
                                        Tu solicitud pasará por revisión admin antes de procesarse. Te contactaremos
                                        por email para confirmar los datos.
                                    </p>
                                    <p className="m-0">
                                        El monto será descontado del saldo disponible solo al momento de aprobación.
                                    </p>
                                </div>
                            </div>

                            {/* Generic error */}
                            {errorMessage && (
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

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <Button
                                    variant="tertiary"
                                    className="flex-1"
                                    onPress={onClose}
                                    isDisabled={createPayout.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1 font-semibold"
                                    onPress={handleSubmit}
                                    isPending={createPayout.isPending}
                                    isDisabled={!canSubmit}
                                >
                                    {createPayout.isPending ? "Enviando..." : "Solicitar retiro"}
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Content>
            </Card>
        </div>
    );
}
