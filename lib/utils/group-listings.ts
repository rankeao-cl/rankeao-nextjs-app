import type { Listing, GroupedCard } from "@/lib/types/marketplace";

export function groupListings(listings: Listing[]): GroupedCard[] {
    const groups = new Map<string, Listing[]>();

    for (const listing of listings) {
        const name = listing.card_name?.trim().toLowerCase();
        // Listings without card_name get their own group
        const key = name || `__single_${listing.id}`;

        const group = groups.get(key);
        if (group) {
            group.push(listing);
        } else {
            groups.set(key, [listing]);
        }
    }

    const result: GroupedCard[] = [];

    for (const [key, group] of groups) {
        // Find cheapest listing as representative
        let representative = group[0];
        let minPrice = representative.price ?? Infinity;

        for (let i = 1; i < group.length; i++) {
            const price = group[i].price ?? Infinity;
            if (price < minPrice) {
                minPrice = price;
                representative = group[i];
            }
        }

        // Count distinct sellers
        const sellerIds = new Set<string>();
        for (const item of group) {
            const sellerId = item.seller_id || item.seller_username || item.seller?.username;
            if (sellerId) sellerIds.add(sellerId);
        }

        result.push({
            group_key: key,
            representative,
            min_price: minPrice === Infinity ? 0 : minPrice,
            seller_count: sellerIds.size || 1,
            listing_count: group.length,
            card_name: representative.card_name || representative.title || "Sin titulo",
            card_image_url: representative.card_image_url || representative.images?.[0]?.url,
            game_name: representative.game_name,
            set_name: representative.set_name,
            rarity: representative.rarity,
        });
    }

    return result;
}
