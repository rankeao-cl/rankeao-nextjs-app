"use client";

import { useEffect, useRef } from "react";
import { toast } from "@heroui/react";

import { useAuth } from "@/lib/hooks/use-auth";
import { useLinkedAccounts } from "@/lib/hooks/use-linked-accounts";

const STORAGE_KEY = "rko_discord_onboard_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function wasRecentlyDismissed(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const ts = Number(raw);
        if (!Number.isFinite(ts)) return false;
        return Date.now() - ts < DISMISS_COOLDOWN_MS;
    } catch {
        return true;
    }
}

function markDismissed() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
        // ignore
    }
}

/**
 * Componente invisible que muestra un toast una vez por sesion si el usuario
 * autenticado todavia no vinculo su cuenta de Discord. No renderiza nada; el
 * toast se dispara desde useEffect via @heroui/react.
 */
export default function DiscordOnboardingToast() {
    const { status } = useAuth();
    const shown = useRef(false);

    const linked = useLinkedAccounts(undefined, {
        enabled: status === "authenticated",
    });

    useEffect(() => {
        if (status !== "authenticated") return;
        if (linked.isLoading) return;
        if (shown.current) return;
        if (wasRecentlyDismissed()) return;

        const hasDiscord = (linked.data ?? []).some((a) => a.provider === "DISCORD");
        if (hasDiscord) return;

        shown.current = true;
        markDismissed();

        toast.info("Vinculá tu cuenta de Discord", {
            description: "Accedé al bot de Rankeao desde /config → Cuentas vinculadas.",
            timeout: 10_000,
        });
    }, [status, linked.isLoading, linked.data]);

    return null;
}
