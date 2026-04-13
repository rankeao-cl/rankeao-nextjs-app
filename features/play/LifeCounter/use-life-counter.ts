import { create } from "zustand";
import type { Session, SessionPlayer } from "@/lib/api/sessions";

interface LifeCounterState {
    session: Session | null;
    isLoading: boolean;

    // Setters — acepta Session directa o un actualizador funcional
    setSession: (session: Session | ((prev: Session | null) => Session | null)) => void;
    setLoading: (loading: boolean) => void;

    // Optimistic actions — actualiza el estado local antes de confirmar con la API
    updatePlayerLife: (seat: number, change: number) => void;
    updateCommanderDamage: (
        targetSeat: number,
        sourceSeat: number,
        damage: number
    ) => void;
    updateCounter: (
        seat: number,
        type: "poison" | "energy" | "experience",
        change: number
    ) => void;
    eliminatePlayer: (seat: number, reason: SessionPlayer["elimination_reason"]) => void;
    resetSession: (session: Session) => void;
}

function updatePlayer(
    players: SessionPlayer[],
    seat: number,
    updater: (p: SessionPlayer) => SessionPlayer
): SessionPlayer[] {
    return players.map((p) => (p.seat === seat ? updater(p) : p));
}

export const useLifeCounterStore = create<LifeCounterState>((set) => ({
    session: null,
    isLoading: false,

    setSession: (sessionOrUpdater) =>
        set((state) => {
            const next =
                typeof sessionOrUpdater === "function"
                    ? sessionOrUpdater(state.session)
                    : sessionOrUpdater;
            return { session: next };
        }),

    setLoading: (loading) => set({ isLoading: loading }),

    updatePlayerLife: (seat, change) =>
        set((state) => {
            if (!state.session) return state;
            return {
                session: {
                    ...state.session,
                    players: updatePlayer(state.session.players, seat, (p) => ({
                        ...p,
                        life_total: p.life_total + change,
                    })),
                },
            };
        }),

    updateCommanderDamage: (targetSeat, sourceSeat, damage) =>
        set((state) => {
            if (!state.session) return state;
            return {
                session: {
                    ...state.session,
                    players: updatePlayer(
                        state.session.players,
                        targetSeat,
                        (p) => {
                            const key = String(sourceSeat);
                            const prev = p.commander_damage[key] ?? 0;
                            const next = Math.max(0, prev + damage);
                            return {
                                ...p,
                                commander_damage: {
                                    ...p.commander_damage,
                                    [key]: next,
                                },
                                // Reduce vida también
                                life_total: p.life_total - damage,
                            };
                        }
                    ),
                },
            };
        }),

    updateCounter: (seat, type, change) =>
        set((state) => {
            if (!state.session) return state;
            const field = `${type}_counters` as
                | "poison_counters"
                | "energy_counters"
                | "experience_counters";
            return {
                session: {
                    ...state.session,
                    players: updatePlayer(state.session.players, seat, (p) => ({
                        ...p,
                        [field]: Math.max(0, p[field] + change),
                    })),
                },
            };
        }),

    eliminatePlayer: (seat, reason) =>
        set((state) => {
            if (!state.session) return state;
            return {
                session: {
                    ...state.session,
                    players: updatePlayer(state.session.players, seat, (p) => ({
                        ...p,
                        is_eliminated: true,
                        elimination_reason: reason,
                    })),
                },
            };
        }),

    resetSession: (session) => set({ session }),
}));
