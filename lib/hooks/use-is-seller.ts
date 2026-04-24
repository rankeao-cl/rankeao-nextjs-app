"use client";

import { useQuery } from "@tanstack/react-query";

import { getMySellerProfile } from "@/lib/api/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { SellerProfile } from "@/lib/types/marketplace";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Resuelve si el usuario autenticado es un seller con perfil activo.
 *
 * Estrategia:
 *   1. Llama a `GET /marketplace/seller/me` (`getMySellerProfile`).
 *   2. Si devuelve un perfil con `user_id`, es seller ⇒ `true`.
 *   3. Si devuelve 404 u otro error, asumimos que NO es seller ⇒ `false`.
 *
 * El resultado se cachea por 5 minutos para evitar hits repetidos
 * desde la sidebar, la página de wallet, etc.
 *
 * Cuando el usuario no está autenticado el hook queda deshabilitado
 * y devuelve `isSeller === false`.
 */
export function useIsSeller() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);

    const query = useQuery({
        queryKey: ["marketplace", "seller", "me", "is-seller"],
        queryFn: async () => {
            try {
                const res = await getMySellerProfile();
                const profile = (res?.data ?? res?.seller ?? res) as
                    | (SellerProfile & Record<string, unknown>)
                    | null
                    | undefined;
                return !!profile?.user_id;
            } catch {
                // 404 / 401 / etc → no es seller
                return false;
            }
        },
        enabled: isAuthed,
        staleTime: FIVE_MINUTES,
        gcTime: FIVE_MINUTES,
        retry: false,
        refetchOnWindowFocus: false,
    });

    return {
        isSeller: query.data === true,
        isLoading: query.isLoading,
        isFetched: query.isFetched,
    };
}
