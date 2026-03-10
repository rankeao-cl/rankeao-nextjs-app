"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tournamentsApi from "@/lib/api/tournaments";
import type { TournamentFilters, CreateTournamentRequest, UpdateTournamentRequest } from "@/lib/types/tournament";

// ── List ──

export function useTournaments(filters?: TournamentFilters) {
    return useQuery({
        queryKey: ["tournaments", filters],
        queryFn: () => tournamentsApi.getTournaments(filters),
    });
}

export function useTournamentDetail(id: string) {
    return useQuery({
        queryKey: ["tournaments", id],
        queryFn: () => tournamentsApi.getTournament(id),
        enabled: !!id,
    });
}

export function useTournamentStandings(id: string) {
    return useQuery({
        queryKey: ["tournaments", id, "standings"],
        queryFn: () => tournamentsApi.getTournamentStandings(id),
        enabled: !!id,
    });
}

export function useTournamentMatches(id: string, params?: Record<string, any>) {
    return useQuery({
        queryKey: ["tournaments", id, "matches", params],
        queryFn: () => tournamentsApi.getTournamentMatches(id, params as any),
        enabled: !!id,
    });
}

export function useMyTournamentHistory(params?: Record<string, any>) {
    return useQuery({
        queryKey: ["tournaments", "history", params],
        queryFn: () => tournamentsApi.getMyTournamentHistory(params as any),
    });
}

// ── Mutations ──

export function useCreateTournament() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTournamentRequest) => tournamentsApi.createTournament(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments"] }),
    });
}

export function useUpdateTournament() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTournamentRequest }) =>
            tournamentsApi.updateTournament(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments"] }),
    });
}

export function useRegisterForTournament() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            tournamentsApi.registerForTournament(id, data),
        onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ["tournaments", id] }),
    });
}

export function useCheckInTournament() {
    return useMutation({
        mutationFn: (id: string) => tournamentsApi.checkInTournament(id),
    });
}

export function useReportMatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tournamentId, matchId, payload }: { tournamentId: string; matchId: string; payload: any }) =>
            tournamentsApi.reportMatch(tournamentId, matchId, payload),
        onSuccess: (_, { tournamentId }) => qc.invalidateQueries({ queryKey: ["tournaments", tournamentId] }),
    });
}
