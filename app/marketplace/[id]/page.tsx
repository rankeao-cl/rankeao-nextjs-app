import { Card, Chip, Avatar, Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "@gravity-ui/icons";
import { getListingDetail, getListings } from "@/lib/api/marketplace";
import ContactSellerButton from "./ContactSellerButton";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    let title = "Detalle de publicacion";
    try {
        const listing = await getListingDetail(id);
        if (listing?.title && !(listing as any)?.error) title = listing.title;
    } catch { /* fallback */ }
    if (title === "Detalle de publicacion") {
        try {
            const listRes = await getListings({ per_page: 100 });
            const found = listRes.listings.find((l) => l.id === id);
            if (found?.title) title = found.title;
        } catch { /* fallback */ }
    }
    return { title };
}

const conditionLabels: Record<string, string> = {
    NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played",
    HP: "Heavily Played", DMG: "Damaged", M: "Mint",
};

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    NM: "success", M: "success", LP: "warning", MP: "warning", HP: "danger", DMG: "danger",
};

export default async function ListingDetailPage({ params }: Props) {
    const { id } = await params;

    let listing: any = null;
    try {
        listing = await getListingDetail(id);
    } catch {
        // Detail endpoint failed — fallback: search in listings list
    }

    // Fallback: find the listing from the list endpoint
    if (!listing || listing.error) {
        try {
            const listRes = await getListings({ per_page: 100 });
            listing = listRes.listings.find((l) => l.id === id) ?? null;
        } catch {
            // both failed
        }
    }

    if (!listing || listing.error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <p className="text-4xl mb-4">😕</p>
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Publicacion no encontrada</h1>
                <p className="text-sm text-[var(--muted)] mb-6">Es posible que haya sido eliminada o el enlace sea incorrecto.</p>
                <Link href="/marketplace">
                    <Button variant="secondary">Volver al marketplace</Button>
                </Link>
            </div>
        );
    }

    const imageUrl = listing.images?.[0]?.url || listing.card_image_url;
    const condition = listing.card_condition || "";
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Link href="/marketplace" className="hover:text-[var(--foreground)] transition-colors">Marketplace</Link>
                <span>/</span>
                <span className="text-[var(--foreground)] truncate max-w-[200px]">{listing.title}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Image */}
                <Card className="surface-card rounded-2xl overflow-hidden">
                    <Card.Content className="p-0">
                        <div className="relative aspect-[3/4] w-full" style={{ background: "var(--surface-secondary)" }}>
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-5xl">🃏</div>
                            )}
                        </div>
                    </Card.Content>
                </Card>

                {/* Right: Info */}
                <div className="space-y-4">
                    {/* Title & Price */}
                    <div>
                        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">{listing.title}</h1>
                        {listing.price != null && (
                            <p className="text-3xl font-extrabold text-[var(--accent)]">
                                ${listing.price.toLocaleString("es-CL")}
                                <span className="text-sm font-normal text-[var(--muted)] ml-2">{listing.currency || "CLP"}</span>
                            </p>
                        )}
                    </div>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {condition && (
                            <Chip color={conditionColors[condition] || "default"} variant="soft" size="sm">
                                {conditionLabels[condition] || condition}
                            </Chip>
                        )}
                        {listing.set_name && <Chip variant="secondary" size="sm">{listing.set_name}</Chip>}
                        {listing.rarity && <Chip variant="soft" size="sm">{listing.rarity}</Chip>}
                        {listing.is_foil && <Chip color="warning" variant="soft" size="sm">Foil</Chip>}
                        {listing.card_language && <Chip variant="secondary" size="sm">{listing.card_language.toUpperCase()}</Chip>}
                        {listing.accepts_offers && <Chip color="accent" variant="soft" size="sm">Acepta ofertas</Chip>}
                    </div>

                    {/* Description */}
                    {listing.description && (
                        <Card className="surface-card rounded-xl">
                            <Card.Content className="p-4">
                                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Descripcion</p>
                                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Shipping info */}
                    <Card className="surface-card rounded-xl">
                        <Card.Content className="p-4 space-y-2">
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Entrega</p>
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground)]">
                                {listing.accepts_shipping && (
                                    <span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)]">📦 Envio disponible</span>
                                )}
                                {listing.accepts_in_person && (
                                    <span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)]">🤝 Entrega en persona</span>
                                )}
                            </div>
                        </Card.Content>
                    </Card>

                    {/* Seller */}
                    <Card className="surface-card rounded-xl">
                        <Card.Content className="p-4">
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Vendedor</p>
                            <div className="flex items-center gap-3">
                                <Avatar size="md">
                                    {listing.seller_avatar_url ? (
                                        <Avatar.Image src={listing.seller_avatar_url} />
                                    ) : null}
                                    <Avatar.Fallback>{sellerName[0]?.toUpperCase()}</Avatar.Fallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{sellerName}</p>
                                    {(listing.city || listing.region) && (
                                        <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                                            <MapPin className="size-3" />
                                            {[listing.city, listing.region].filter(Boolean).join(", ")}
                                        </p>
                                    )}
                                </div>
                                {(listing.is_verified_seller || listing.is_verified_store) && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ background: "var(--success)", color: "var(--success-foreground)" }}>
                                        Verificado
                                    </span>
                                )}
                            </div>
                        </Card.Content>
                    </Card>

                    {/* CTAs */}
                    <div className="flex gap-3 pt-2">
                        <ContactSellerButton
                            sellerUsername={listing.seller_username}
                            listingTitle={listing.title}
                            listingId={listing.id || id}
                        />
                        <Link href="/marketplace" className="flex-1">
                            <Button type="button" variant="tertiary" className="w-full font-semibold">
                                Volver
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
