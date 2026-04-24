"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { Button } from "@heroui/react/button";

import { useSubmitFreeForm } from "@/lib/hooks/use-promotions";
import { formatRut, isValidRut } from "@/lib/utils/rut";
import { mapErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/errors";

interface FreeFormEntryFormProps {
    slug: string;
    onSuccess?: () => void;
}

// CAPTCHA real pendiente de integracion (Turnstile/hCaptcha, ver MD 03 §3).
// Por ahora el usuario escribe el texto mostrado; el backend aceptara el
// token dummy y el BE real validara cuando se integre el proveedor.
const MOCK_CAPTCHA_CHALLENGE = "RANKEAO";

type FormErrors = {
    fullName?: string;
    rut?: string;
    email?: string;
    captcha?: string;
};

export default function FreeFormEntryForm({ slug, onSuccess }: FreeFormEntryFormProps) {
    const [fullName, setFullName] = useState("");
    const [rut, setRut] = useState("");
    const [email, setEmail] = useState("");
    const [captcha, setCaptcha] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [submittedOk, setSubmittedOk] = useState(false);

    const mutation = useSubmitFreeForm(slug);

    function validate(): boolean {
        const next: FormErrors = {};
        if (fullName.trim().length < 3) {
            next.fullName = "Ingresa tu nombre completo";
        }
        if (!isValidRut(rut)) {
            next.rut = "RUT invalido (ej: 12.345.678-5)";
        }
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
            next.email = "Email invalido";
        }
        if (captcha.trim().toUpperCase() !== MOCK_CAPTCHA_CHALLENGE) {
            next.captcha = `Escribe exactamente: ${MOCK_CAPTCHA_CHALLENGE}`;
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        try {
            await mutation.mutateAsync({
                full_name: fullName.trim(),
                rut: formatRut(rut),
                email: email.trim() || undefined,
                captcha_token: captcha.trim(),
            });
            toast.success("¡Listo! Quedaste participando en el sorteo.");
            setSubmittedOk(true);
            setFullName("");
            setRut("");
            setEmail("");
            setCaptcha("");
            onSuccess?.();
        } catch (err) {
            if (err instanceof ApiError && err.status === 429) {
                toast.danger("Limite alcanzado", {
                    description: "Ya enviaste una inscripcion hoy o alcanzaste el limite. Intenta nuevamente mas tarde.",
                });
                return;
            }
            if (err instanceof ApiError && err.status === 409) {
                toast.danger("RUT ya inscrito", {
                    description: "Este RUT ya participa en esta promocion sin compra.",
                });
                return;
            }
            toast.danger("No pudimos registrar tu inscripcion", {
                description: mapErrorMessage(err),
            });
        }
    }

    if (submittedOk) {
        return (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-foreground">
                <p className="font-semibold">¡Quedaste inscrito en el sorteo!</p>
                <p className="mt-1 text-muted">
                    Te contactaremos si resultas ganador. Segun la Ley 19.496 art. 35, la
                    participacion sin compra tiene las mismas probabilidades que una chapita.
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    className="mt-3"
                    onPress={() => setSubmittedOk(false)}
                >
                    Inscribir a otra persona
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-surface/60 p-3 text-xs text-muted">
                Participa en el sorteo <strong className="text-foreground">sin comprar</strong> nada.
                Segun la Ley 19.496 art. 35, toda persona con RUT valido puede inscribirse 1 vez
                por promocion.
            </div>

            <div className="space-y-1.5">
                <label htmlFor="ff-name" className="text-xs font-semibold text-muted">
                    Nombre completo
                </label>
                <input
                    id="ff-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Ej: Maria Gonzalez"
                />
                {errors.fullName && (
                    <p className="text-xs text-[var(--danger,#ef4444)]">{errors.fullName}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <label htmlFor="ff-rut" className="text-xs font-semibold text-muted">
                    RUT
                </label>
                <input
                    id="ff-rut"
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    onBlur={() => {
                        if (rut && isValidRut(rut)) setRut(formatRut(rut));
                    }}
                    autoComplete="off"
                    required
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                    placeholder="12.345.678-5"
                />
                {errors.rut && (
                    <p className="text-xs text-[var(--danger,#ef4444)]">{errors.rut}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <label htmlFor="ff-email" className="text-xs font-semibold text-muted">
                    Email (opcional)
                </label>
                <input
                    id="ff-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                    placeholder="maria@ejemplo.cl"
                />
                {errors.email && (
                    <p className="text-xs text-[var(--danger,#ef4444)]">{errors.email}</p>
                )}
                <p className="text-[11px] text-muted">
                    Lo usamos solo para notificarte si resultas ganador.
                </p>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="ff-captcha" className="text-xs font-semibold text-muted">
                    Verificacion
                </label>
                <div className="flex items-center gap-3">
                    <div
                        aria-hidden="true"
                        className="select-none rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm font-bold tracking-[0.3em] text-foreground"
                    >
                        {MOCK_CAPTCHA_CHALLENGE}
                    </div>
                    <input
                        id="ff-captcha"
                        type="text"
                        value={captcha}
                        onChange={(e) => setCaptcha(e.target.value)}
                        autoComplete="off"
                        required
                        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-[var(--accent)] focus:outline-none"
                        placeholder="Escribe el codigo"
                    />
                </div>
                {errors.captcha && (
                    <p className="text-xs text-[var(--danger,#ef4444)]">{errors.captcha}</p>
                )}
                <p className="text-[11px] text-muted">
                    CAPTCHA de demostracion. La version final integrara Turnstile/hCaptcha.
                </p>
            </div>

            <Button
                type="submit"
                variant="primary"
                isPending={mutation.isPending}
                className="w-full"
            >
                Inscribirme al sorteo
            </Button>
        </form>
    );
}
