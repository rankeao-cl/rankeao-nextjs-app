"use client";

import { Card, Chip } from "@heroui/react";
import { ArrowUpRightFromSquare, Flame, Cup } from "@gravity-ui/icons";
import Link from "next/link";

export default function RightSidebar() {
    return (
        <aside
            className="hidden xl:flex flex-col w-[280px] h-[calc(100vh-4rem)] sticky top-16 border-l overflow-y-auto p-4 gap-4"
            style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            {/* Trending */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Flame className="size-4 text-[var(--warning)]" />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Trending
                    </h3>
                </div>
                <div className="flex flex-col gap-2">
                    {["Pokemon TCG", "Magic Standard", "Yu-Gi-Oh! Edison"].map(
                        (topic) => (
                            <div
                                key={topic}
                                className="text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                style={{
                                    background: "var(--surface-secondary)",
                                    color: "var(--foreground)",
                                }}
                            >
                                {topic}
                            </div>
                        )
                    )}
                </div>
            </Card>

            {/* Torneos en curso */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Cup className="size-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Torneos en Curso
                    </h3>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="text-xs p-2 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>
                                Liga Semanal PKM
                            </span>
                            <Chip size="sm" color="success" variant="soft">
                                En vivo
                            </Chip>
                        </div>
                        <span style={{ color: "var(--muted)" }}>16 jugadores • Ronda 3/5</span>
                    </div>
                    <div className="text-xs p-2 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>
                                Modern FNM
                            </span>
                            <Chip size="sm" color="warning" variant="soft">
                                Próximo
                            </Chip>
                        </div>
                        <span style={{ color: "var(--muted)" }}>8 inscritos • Hoy 19:00</span>
                    </div>
                </div>
            </Card>

            {/* Sugerencias */}
            <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                    Sugerencias
                </h3>
                <div className="flex flex-col gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <Link
                        href="/comunidades"
                        className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                    >
                        <ArrowUpRightFromSquare className="size-3.5" />
                        <span>Explora tiendas cerca de ti</span>
                    </Link>
                    <Link
                        href="/ranking"
                        className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                    >
                        <ArrowUpRightFromSquare className="size-3.5" />
                        <span>Mira el ranking global</span>
                    </Link>
                </div>
            </Card>
        </aside>
    );
}
