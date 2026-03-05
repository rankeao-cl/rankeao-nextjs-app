import { Card, CardContent, Chip } from "@heroui/react";
import Image from "next/image";
import type { Listing } from "@/lib/api";

function formatPrice(cents?: number) {
  if (!cents) return "$0";
  return `$${(cents / 100).toLocaleString("es-CL")}`;
}

const conditionLabels: Record<string, string> = {
  NM: "Near Mint",
  LP: "Light Played",
  MP: "Moderate Played",
  HP: "Heavy Played",
  DMG: "Damaged",
};

export default function ProductCard({ listing }: { listing: Listing }) {
  const imageUrl = listing.images?.[0]?.url || listing.images?.[0]?.thumbnail_url;

  return (
    <Card className="surface-card card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[4/5] w-full bg-gray-800 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title || listing.card_name || "Carta"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent" />
          {listing.is_foil && (
            <div className="absolute top-2 left-2 z-10">
              <Chip size="sm" color="warning" variant="primary" className="text-xs font-semibold">
                ✨ Foil
              </Chip>
            </div>
          )}
          {listing.game_name && (
            <div className="absolute top-2 right-2 z-10">
              <Chip size="sm" color="accent" variant="soft" className="text-[10px] font-semibold">
                {listing.game_name}
              </Chip>
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-2.5">
          <h3 className="font-bold text-white text-sm line-clamp-2 min-h-10">
            {listing.title || listing.card_name || "Sin título"}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-extrabold text-cyan-300">
              {formatPrice(listing.price)}
            </span>
            {listing.card_condition && (
              <Chip size="sm" variant="secondary" className="text-[10px] text-gray-200 border-purple-500/35">
                {conditionLabels[listing.card_condition] || listing.card_condition}
              </Chip>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 gap-2">
            <span className="truncate">{listing.seller_username ? `Vendedor: ${listing.seller_username}` : "Vendedor anonimo"}</span>
            <span className="truncate text-right">{listing.city || listing.region || "Chile"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
