import { Card, Chip } from "@heroui/react";

export interface FeedCollection {
    id: string;
    title: string;
    card_count: number;
    thumbnails?: string[];
    estimated_value?: number;
    conditions?: Record<string, number>;
}

export default function CollectionCard({ collection }: { collection: FeedCollection }) {
    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-3">
                <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                    {collection.title}
                </h3>

                {/* Grid preview */}
                {collection.thumbnails && collection.thumbnails.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 rounded-lg overflow-hidden">
                        {collection.thumbnails.slice(0, 8).map((src, i) => (
                            <div
                                key={i}
                                className="aspect-[2.5/3.5] overflow-hidden"
                                style={{ background: "var(--surface-secondary)" }}
                            >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                    <span>{collection.card_count} cartas</span>
                    {collection.estimated_value != null && (
                        <span className="font-medium" style={{ color: "var(--accent)" }}>
                            ~${collection.estimated_value.toLocaleString("es-CL")}
                        </span>
                    )}
                </div>

                {/* Conditions */}
                {collection.conditions && Object.keys(collection.conditions).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(collection.conditions).map(([cond, count]) => (
                            <Chip key={cond} variant="soft" size="sm">
                                {cond}: {count}
                            </Chip>
                        ))}
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}
