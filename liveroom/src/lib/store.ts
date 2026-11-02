// The app's memory (zustand): profile, memories and match state, saved on the phone.
// Why: every screen reads and changes the same data, and it survives closing the app.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Team } from './match/types';
import type { Moment } from './moments/detect';

export type Speed = 1 | 2 | 4;

export type Frame = { uri: string; offsetMs: number };
export type Capture = { moment: Moment; tension: number; frames: Frame[] };

export type Memory = {
    id: string;
    moment: Moment;
    frameUri: string | null;
    photoId?: string;
    hype: number;
    createdAt: number;
    shared: boolean;
    posted: boolean;
};

export type Profile = {
    name: string;
    team: Team;
    rival: string;
    room: string;
    autoRoast: boolean;
    sounds: boolean;
};

const makeFanId = () => `fan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type RoarState = {
    fanId: string;
    profile: Profile;
    memories: Memory[];
    matchesLived: number;
    startedAt: number | null;
    startIndex: number;
    speed: Speed;
    delayMs: number;
    armyPoints: Record<Team, number>;
    capture: Capture | null;
    lastMoment: Moment | null;
    setProfile: (p: Partial<Profile>) => void;
    countMatch: () => void;
    start: (fromIndex?: number) => void;
    stop: () => void;
    setSpeed: (speed: Speed, currentIndex: number) => void;
    setDelay: (ms: number, currentIndex: number) => void;
    addArmyPoints: (team: Team, pts: number) => void;
    setCapture: (c: Capture | null) => void;
    setLastMoment: (m: Moment) => void;
    keepMemory: (m: Memory) => void;
    updateMemory: (id: string, patch: Partial<Memory>) => void;
};

export const useRoar = create<RoarState>()(
    persist(
        (set) => ({
            fanId: makeFanId(),
            profile: { name: 'Lucky', team: 'MI', rival: 'Aman', room: '', autoRoast: true, sounds: true },
            memories: [],
            matchesLived: 0,
            startedAt: null,
            startIndex: 0,
            speed: 4,
            delayMs: 0,
            armyPoints: { MI: 0, CSK: 0 },
            capture: null,
            lastMoment: null,

            setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
            countMatch: () => set((s) => ({ matchesLived: s.matchesLived + 1 })),
            start: (fromIndex = 0) =>
                set({ startedAt: Date.now(), startIndex: fromIndex, armyPoints: { MI: 0, CSK: 0 }, capture: null }),
            stop: () => set({ startedAt: null }),
            setSpeed: (speed, currentIndex) => set({ speed, startedAt: Date.now(), startIndex: currentIndex + 1 }),
            setDelay: (delayMs, currentIndex) => set({ delayMs, startedAt: Date.now(), startIndex: currentIndex + 1 }),
            addArmyPoints: (team, pts) => set((s) => ({ armyPoints: { ...s.armyPoints, [team]: s.armyPoints[team] + pts } })),
            setCapture: (capture) => set({ capture }),
            setLastMoment: (lastMoment) => set({ lastMoment }),
            keepMemory: (m) => set((s) => ({ memories: [m, ...s.memories], capture: null })),
            updateMemory: (id, patch) =>
                set((s) => ({ memories: s.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
        }),
        {
            name: 'roar',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (s) => ({ fanId: s.fanId, profile: s.profile, memories: s.memories, matchesLived: s.matchesLived }),
            merge: (saved, current) => {
                const s = (saved ?? {}) as Partial<RoarState>;
                const profile = { ...current.profile, ...s.profile };
                if (profile.rival === 'Rahul') profile.rival = 'Aman';
                return { ...current, ...s, profile };
            },
            onRehydrateStorage: () => (state) => {
                if (state) useRoar.setState({ fanId: state.fanId });
            },
        },
    ),
);
