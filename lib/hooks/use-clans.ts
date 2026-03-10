"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as clansApi from "@/lib/api/clans";
import type { CreateClanRequest } from "@/lib/types/clan";
import type { Params } from "@/lib/types/api";

export function useClans(params?: Params) {
    return useQuery({
        queryKey: ["clans", params],
        queryFn: () => clansApi.getClans(params),
    });
}

export function useClanDetail(clanId: string) {
    return useQuery({
        queryKey: ["clans", clanId],
        queryFn: () => clansApi.getClan(clanId),
        enabled: !!clanId,
    });
}

export function useMyClan(token?: string) {
    return useQuery({
        queryKey: ["clans", "mine"],
        queryFn: () => clansApi.getMyClan(token),
    });
}

export function useCreateClan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateClanRequest) => clansApi.createClan(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["clans"] }),
    });
}

export function useApplyToClan() {
    return useMutation({
        mutationFn: ({ clanId, message }: { clanId: string; message?: string }) =>
            clansApi.applyToClan(clanId, message),
    });
}

export function useLeaveClan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (clanId: string) => clansApi.leaveClan(clanId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["clans"] }),
    });
}
