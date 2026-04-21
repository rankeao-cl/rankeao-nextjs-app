"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@heroui/react/modal";
import { Button } from "@heroui/react/button";
import { Spinner } from "@heroui/react/spinner";
import { toast } from "@heroui/react";

import IconDiscord from "@/components/icons/IconDiscord";
import { useLinkedAccounts, useGenerateDiscordCode } from "@/lib/hooks/use-linked-accounts";

interface DiscordLinkModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLinked?: () => void;
}

function formatSeconds(totalSeconds: number) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function DiscordLinkModal({ isOpen, onOpenChange, onLinked }: DiscordLinkModalProps) {
    const [code, setCode] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [expired, setExpired] = useState(false);

    const generate = useGenerateDiscordCode();

    // Polling de linked accounts mientras el modal este abierto.
    const linked = useLinkedAccounts(undefined, {
        enabled: isOpen,
        refetchInterval: isOpen ? 5_000 : undefined,
    });

    const isDiscordLinked = useMemo(
        () => (linked.data ?? []).some((a) => a.provider === "DISCORD"),
        [linked.data],
    );

    // Cerrar modal y notificar cuando Discord aparece linkeado.
    useEffect(() => {
        if (isOpen && isDiscordLinked && code) {
            toast.success("Cuenta de Discord vinculada");
            onLinked?.();
            onOpenChange(false);
        }
    }, [isOpen, isDiscordLinked, code, onLinked, onOpenChange]);

    // Al abrir, generar codigo automaticamente si no hay uno activo.
    useEffect(() => {
        if (!isOpen) return;
        if (code || generate.isPending) return;

        generate.mutate(undefined, {
            onSuccess: (data) => {
                setCode(data.code);
                setSecondsLeft(data.expires_in_seconds);
                setExpired(false);
            },
            onError: () => {
                toast.danger("No se pudo generar el código", {
                    description: "Intentá de nuevo en unos segundos.",
                });
            },
        });
    }, [isOpen, code, generate]);

    // Reset al cerrar.
    useEffect(() => {
        if (!isOpen) {
            setCode("");
            setSecondsLeft(0);
            setExpired(false);
        }
    }, [isOpen]);

    // Countdown.
    useEffect(() => {
        if (!isOpen || !code || expired) return;
        if (secondsLeft <= 0) {
            setExpired(true);
            return;
        }
        const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [isOpen, code, secondsLeft, expired]);

    function regenerate() {
        setCode("");
        setExpired(false);
        setSecondsLeft(0);
    }

    async function copyCode() {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            toast.success("Código copiado");
        } catch {
            toast.danger("No se pudo copiar al portapapeles");
        }
    }

    const inviteURL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "";

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop>
                <Modal.Container placement="center" size="md">
                    <Modal.Dialog>
                        <Modal.Header>
                            <div className="flex items-center gap-2">
                                <IconDiscord size={20} color="#5865F2" />
                                <Modal.Heading>Vincular Discord</Modal.Heading>
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            {generate.isPending && !code ? (
                                <div className="flex items-center justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : expired ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-white/70">
                                        El código expiró. Generá uno nuevo y usalo en Discord antes de que caduque.
                                    </p>
                                    <Button onPress={regenerate} className="w-full">
                                        Generar otro código
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                                        <div className="mb-2 text-xs uppercase tracking-widest text-white/50">
                                            Tu código
                                        </div>
                                        <div className="select-all font-mono text-3xl font-bold tracking-[0.3em] text-white">
                                            {code || "------"}
                                        </div>
                                        <div className="mt-2 text-xs text-white/50">
                                            Expira en {formatSeconds(secondsLeft)}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onPress={copyCode} className="flex-1">
                                            Copiar código
                                        </Button>
                                        {inviteURL ? (
                                            <a
                                                href={inviteURL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                            >
                                                Abrir Discord
                                            </a>
                                        ) : null}
                                    </div>

                                    <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
                                        <li>Abrí Discord y entrá al server de Rankeao.</li>
                                        <li>
                                            Escribí <code className="font-mono text-white">/vincular codigo:{code || "ABC123"}</code>.
                                        </li>
                                        <li>Esta ventana se cierra sola cuando se complete.</li>
                                    </ol>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Modal.CloseTrigger>
                                <Button variant="ghost">Cerrar</Button>
                            </Modal.CloseTrigger>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
