"use client";

import { useEffect, useState } from "react";
import { Modal } from "@heroui/react/modal";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react";

import { useStartSellerOnboarding } from "@/lib/hooks/use-marketplace-v2";
import { mapErrorMessage } from "@/lib/api/errors";

// Validacion basica de RUT chileno con modulo 11.
// No pretende ser canonica: el backend es la fuente de verdad.
// Acepta "12.345.678-5", "12345678-5", "123456785".
function cleanRut(input: string): string {
    return input.replace(/\./g, "").replace(/-/g, "").toUpperCase().trim();
}

function computeRutDv(rutDigits: string): string {
    let sum = 0;
    let multiplier = 2;
    for (let i = rutDigits.length - 1; i >= 0; i--) {
        sum += parseInt(rutDigits[i], 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return "0";
    if (remainder === 10) return "K";
    return String(remainder);
}

export function isValidRut(input: string): boolean {
    const cleaned = cleanRut(input);
    if (cleaned.length < 2) return false;
    const digits = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    if (!/^\d+$/.test(digits)) return false;
    if (!/^[0-9K]$/.test(dv)) return false;
    return computeRutDv(digits) === dv;
}

function formatRut(input: string): string {
    const cleaned = cleanRut(input);
    if (cleaned.length < 2) return input;
    const digits = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots}-${dv}`;
}

export interface SellerOnboardingModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function SellerOnboardingModal({
    isOpen,
    onOpenChange,
    onSuccess,
}: SellerOnboardingModalProps) {
    const [displayName, setDisplayName] = useState("");
    const [rut, setRut] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ displayName?: string; rut?: string }>({});

    const mutation = useStartSellerOnboarding();

    useEffect(() => {
        if (!isOpen) {
            setDisplayName("");
            setRut("");
            setPhone("");
            setErrors({});
        }
    }, [isOpen]);

    function validate(): boolean {
        const next: { displayName?: string; rut?: string } = {};
        if (displayName.trim().length < 2) {
            next.displayName = "Ingresa un nombre de al menos 2 caracteres";
        }
        if (!isValidRut(rut)) {
            next.rut = "RUT invalido (ej: 12.345.678-5)";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        try {
            await mutation.mutateAsync({
                display_name: displayName.trim(),
                rut: formatRut(rut),
                phone: phone.trim() || undefined,
            });
            toast.success("¡Listo! Ahora eres vendedor en Rankeao.");
            onSuccess?.();
            onOpenChange(false);
        } catch (err) {
            toast.danger("No pudimos completar el alta", {
                description: mapErrorMessage(err),
            });
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop>
                <Modal.Container placement="center" size="md">
                    <Modal.Dialog>
                        <form onSubmit={handleSubmit}>
                            <Modal.Header>
                                <Modal.Heading>Conviertete en vendedor</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted">
                                        Completa los datos para empezar a vender tus cartas. Podras editar
                                        tu informacion cuando quieras desde tu perfil.
                                    </p>

                                    <div className="space-y-1.5">
                                        <label htmlFor="seller-display-name" className="text-xs font-semibold text-muted">
                                            Nombre publico
                                        </label>
                                        <input
                                            id="seller-display-name"
                                            type="text"
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                                            placeholder="Ej: Cartas de Benja"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            autoComplete="off"
                                            required
                                        />
                                        {errors.displayName && (
                                            <p className="text-xs text-[var(--danger,#ef4444)]">{errors.displayName}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="seller-rut" className="text-xs font-semibold text-muted">
                                            RUT
                                        </label>
                                        <input
                                            id="seller-rut"
                                            type="text"
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                                            placeholder="12.345.678-5"
                                            value={rut}
                                            onChange={(e) => setRut(e.target.value)}
                                            onBlur={() => {
                                                if (rut && isValidRut(rut)) setRut(formatRut(rut));
                                            }}
                                            inputMode="text"
                                            autoComplete="off"
                                            required
                                        />
                                        {errors.rut && (
                                            <p className="text-xs text-[var(--danger,#ef4444)]">{errors.rut}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="seller-phone" className="text-xs font-semibold text-muted">
                                            Telefono (opcional)
                                        </label>
                                        <input
                                            id="seller-phone"
                                            type="tel"
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                                            placeholder="+56 9 1234 5678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            autoComplete="tel"
                                        />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Modal.CloseTrigger>
                                    <Button variant="ghost" type="button">Cancelar</Button>
                                </Modal.CloseTrigger>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isPending={mutation.isPending}
                                >
                                    Activar cuenta de vendedor
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
