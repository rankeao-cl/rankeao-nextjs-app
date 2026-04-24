"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { Copy, Check } from "@gravity-ui/icons";

interface ChapitaHashProps {
    hash: string;
    truncate?: number;
}

function truncateHash(hash: string, truncate: number): string {
    if (!hash) return "";
    if (hash.length <= truncate * 2 + 3) return hash;
    return `${hash.slice(0, truncate)}...${hash.slice(-truncate)}`;
}

export default function ChapitaHash({ hash, truncate = 8 }: ChapitaHashProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(hash);
            setCopied(true);
            toast.success("Hash copiado al portapapeles");
            setTimeout(() => setCopied(false), 1600);
        } catch {
            toast.danger("No pudimos copiar el hash");
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={hash}
            aria-label="Copiar hash completo"
            className="group inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-[var(--accent)]"
        >
            <span className="truncate">{truncateHash(hash, truncate)}</span>
            {copied ? (
                <Check className="size-[13px] text-emerald-500 shrink-0" />
            ) : (
                <Copy className="size-[13px] text-muted group-hover:text-foreground shrink-0" />
            )}
        </button>
    );
}
