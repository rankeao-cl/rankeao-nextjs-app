"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "@gravity-ui/icons";

interface TorneosViewToggleProps {
    currentView: "list" | "calendar";
}

export default function TorneosViewToggle({ currentView }: TorneosViewToggleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function setView(view: "list" | "calendar") {
        const params = new URLSearchParams(searchParams.toString());
        if (view === "calendar") {
            params.set("view", "calendar");
        } else {
            params.delete("view");
        }
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
            <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentView === "list"
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
            >
                Lista
            </button>
            <button
                onClick={() => setView("calendar")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    currentView === "calendar"
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
            >
                <Calendar className="size-3" />
                Calendario
            </button>
        </div>
    );
}
