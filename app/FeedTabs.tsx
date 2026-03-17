"use client";

import { Tabs, Chip, Select, ListBox } from "@heroui/react";

const CONTENT_TYPES = [
    { key: "todo", label: "Todo" },
    { key: "posts", label: "Posts" },
    { key: "mazos", label: "Mazos" },
    { key: "ventas", label: "Ventas" },
    { key: "torneos", label: "Torneos" },
    { key: "discusiones", label: "Discusiones" },
] as const;

const GAMES = [
    { key: "all", label: "Todos los juegos" },
    { key: "pokemon", label: "Pokémon" },
    { key: "magic", label: "Magic" },
    { key: "yugioh", label: "Yu-Gi-Oh!" },
] as const;

interface FeedTabsProps {
    selected: string;
    onSelectionChange: (key: string) => void;
    contentType?: string;
    onContentTypeChange?: (type: string) => void;
    game?: string;
    onGameChange?: (game: string) => void;
}

export default function FeedTabs({
    selected,
    onSelectionChange,
    contentType = "todo",
    onContentTypeChange,
    game = "all",
    onGameChange,
}: FeedTabsProps) {
    return (
        <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--background)]">
            <Tabs
                selectedKey={selected}
                onSelectionChange={(key) => onSelectionChange(String(key))}
                variant="secondary"
                className="w-full"
            >
                <Tabs.ListContainer>
                    <Tabs.List
                        aria-label="Feed"
                        className="w-full justify-center"
                    >
                        <Tabs.Tab id="para-ti">
                            Para ti
                            <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id="siguiendo">
                            Siguiendo
                            <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id="trending">
                            Trending
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>

            {/* Content type filter chips + Game dropdown */}
            <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {CONTENT_TYPES.map((ct) => {
                        const isActive = contentType === ct.key;
                        return (
                            <Chip
                                key={ct.key}
                                size="sm"
                                variant={isActive ? "primary" : "secondary"}
                                className="cursor-pointer shrink-0 transition-all duration-150"
                                style={
                                    isActive
                                        ? {
                                              background: "var(--accent)",
                                              color: "var(--accent-foreground)",
                                          }
                                        : {
                                              color: "var(--muted)",
                                          }
                                }
                                onClick={() => onContentTypeChange?.(ct.key)}
                            >
                                {ct.label}
                            </Chip>
                        );
                    })}
                </div>

                {/* Game filter dropdown */}
                <Select
                    aria-label="Filtrar por juego"
                    selectedKey={game}
                    onSelectionChange={(key) => onGameChange?.(String(key))}
                    placeholder="Juego"
                    className="w-36 shrink-0"
                >
                    <Select.Trigger className="bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-8 text-xs">
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {GAMES.map((g) => (
                                <ListBox.Item key={g.key} id={g.key} textValue={g.label}>
                                    {g.label}
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>
        </div>
    );
}
