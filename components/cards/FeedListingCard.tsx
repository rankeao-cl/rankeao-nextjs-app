import { Avatar, Chip, Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types/marketplace";
import { Heart, Comment, ArrowShapeTurnUpRight, MapPin, ShoppingCart } from "@gravity-ui/icons";

function timeAgo(dateStr?: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}sem`;
}

export default function FeedListingCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;

    return (
        <article className="glass overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <Avatar size="sm" className="w-9 h-9">
                    {listing.seller_avatar_url ? (
                        <Avatar.Image src={listing.seller_avatar_url} alt={sellerName} />
                    ) : null}
                    <Avatar.Fallback className="text-xs">
                        {sellerName[0]?.toUpperCase()}
                    </Avatar.Fallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {sellerName}
                        </span>
                        {isStore && <span className="text-[var(--accent)] text-xs">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        {listing.city && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="size-3" />
                                {listing.city}
                            </span>
                        )}
                        <span>{timeAgo(listing.created_at)}</span>
                    </div>
                </div>
                {listing.price != null && (
                    <span className="text-base font-bold text-[var(--accent)] shrink-0">
                        ${listing.price.toLocaleString("es-CL")}
                    </span>
                )}
            </div>

            {/* Content: title + tags */}
            <div className="px-4 pb-3 space-y-2">
                <Link href={`/marketplace/${listing.id}`}>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed hover:text-[var(--accent)] transition-colors">
                        <span className="font-semibold">{listing.title}</span>
                        {listing.set_name && <span className="text-[var(--muted)]"> — {listing.set_name}</span>}
                    </p>
                </Link>

                <div className="flex flex-wrap gap-1.5">
                    {listing.game_name && <Chip variant="secondary" size="sm">{listing.game_name}</Chip>}
                    {listing.card_condition && <Chip variant="soft" size="sm">{listing.card_condition}</Chip>}
                    {listing.rarity && <Chip variant="soft" size="sm">{listing.rarity}</Chip>}
                    {listing.is_foil && <Chip color="warning" variant="soft" size="sm">Foil</Chip>}
                </div>
            </div>

            {/* Image */}
            {imageUrl && (
                <Link href={`/marketplace/${listing.id}`}>
                    <div className="relative w-full aspect-[4/3] bg-[var(--surface-secondary)]">
                        <Image
                            src={imageUrl}
                            alt={listing.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, 700px"
                        />
                    </div>
                </Link>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <Heart className="size-4" /> Me gusta
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <Comment className="size-4" /> Comentar
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <ArrowShapeTurnUpRight className="size-4" /> Compartir
                    </button>
                </div>
                <Link href={`/marketplace/${listing.id}`}>
                    <Button size="sm" className="font-semibold text-xs gap-1.5 bg-[var(--accent)] text-[var(--accent-foreground)]">
                        <ShoppingCart className="size-3.5" />
                        Contactar
                    </Button>
                </Link>
            </div>
        </article>
    );
}
