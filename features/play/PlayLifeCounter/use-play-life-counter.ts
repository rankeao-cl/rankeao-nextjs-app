import { create } from "zustand";
import type { LCSession, LCPlayer } from "@/lib/api/play";

interface PlayLCState {
    session: LCSession | null;
    isLoading: boolean;

    setSession: (session: LCSession | ((prev: LCSession | null) => LCSession | null)) => void;
    setLoading:  (v: boolean) => void;

    // Optimistic updates
    updatePlayerLife:     (seat: number, change: number) => void;
    updateCommanderDamage: (targetSeat: number, sourceSeat: number, damage: number) => void;
    updateCounter:        (seat: number, type: "poison" | "energy" | "experience", change: number) => void;
    eliminatePlayer:      (seat: number, reason: LCPlayer["elimination_reason"]) => void;
}

function patch(
    players: LCPlayer[],
    seat: number,
    fn: (p: LCPlayer) => LCPlayer
): LCPlayer[] {
    return players.map((p) => (p.seat === seat ? fn(p) : p));
}

export const usePlayLCStore = create<PlayLCState>((set) => ({
    session:   null,
    isLoading: false,

    setSession: (arg) =>
        set((s) => ({
            session: typeof arg === "function" ? arg(s.session) : arg,
        })),

    setLoading: (v) => set({ isLoading: v }),

    updatePlayerLife: (seat, change) =>
        set((s) => {
            if (!s.session) return s;
            return {
                session: {
                    ...s.session,
                    players: patch(s.session.players, seat, (p) => ({
                        ...p,
                        life_total: p.life_total + change,
                    })),
                },
            };
        }),

    updateCommanderDamage: (targetSeat, sourceSeat, damage) =>
        set((s) => {
            if (!s.session) return s;
            return {
                session: {
                    ...s.session,
                    players: patch(s.session.players, targetSeat, (p) => ({
                        ...p,
                        commander_damage: {
                            ...p.commander_damage,
                            [String(sourceSeat)]:
                                (p.commander_damage[String(sourceSeat)] ?? 0) + damage,
                        },
                    })),
                },
            };
        }),

    updateCounter: (seat, type, change) =>
        set((s) => {
            if (!s.session) return s;
            const col: Record<string, keyof LCPlayer> = {
                poison:     "poison_counters",
                energy:     "energy_counters",
                experience: "experience_counters",
            };
            return {
                session: {
                    ...s.session,
                    players: patch(s.session.players, seat, (p) => ({
                        ...p,
                        [col[type]]: (p[col[type] as keyof LCPlayer] as number) + change,
                    })),
                },
            };
        }),

    eliminatePlayer: (seat, reason) =>
        set((s) => {
            if (!s.session) return s;
            return {
                session: {
                    ...s.session,
                    players: patch(s.session.players, seat, (p) => ({
                        ...p,
                        is_eliminated:      true,
                        elimination_reason: reason,
                    })),
                },
            };
        }),
}));
