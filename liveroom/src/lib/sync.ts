// Quietly copies your profile, memories and photos to MongoDB whenever they change.
// Why: the phone stays the main copy (works offline), and the database keeps a backup.

import { useEffect, useState } from 'react';
import { useRoar, type Memory } from './store';
import { saveFan, saveMemory, uploadPhoto } from './api';

const WAIT_BEFORE_SAVING_MS = 1000; // so typing your name doesn't send one save per letter

// What we last sent for each memory, so unchanged memories aren't sent again.
const lastSentMemory = new Map<string, string>();

async function sendMemory(fanId: string, memory: Memory) {
    const snapshot = JSON.stringify(memory);
    if (lastSentMemory.get(memory.id) === snapshot) return;
    lastSentMemory.set(memory.id, snapshot);

    try {
        // First time: upload the photo, remember its id. Saving that id changes the memory,
        // which runs this function again and then saves the memory itself.
        if (memory.frameUri && !memory.photoId) {
            const photoId = await uploadPhoto(memory.frameUri);
            useRoar.getState().updateMemory(memory.id, { photoId });
            return;
        }
        await saveMemory(fanId, memory);
    } catch {
        lastSentMemory.delete(memory.id); // not saved: try again next time
    }
}

// True once the phone's saved data has loaded (before that we'd save the empty defaults).
function useStoreLoaded() {
    const [loaded, setLoaded] = useState(useRoar.persist.hasHydrated());
    useEffect(() => useRoar.persist.onFinishHydration(() => setLoaded(true)), []);
    return loaded;
}

export function useSaveToDatabase() {
    const loaded = useStoreLoaded();
    const fanId = useRoar((s) => s.fanId);
    const profile = useRoar((s) => s.profile);
    const matchesLived = useRoar((s) => s.matchesLived);
    const memories = useRoar((s) => s.memories);

    // 1. Save my profile and stats whenever they change.
    useEffect(() => {
        if (!loaded) return;
        const timer = setTimeout(() => saveFan(fanId, profile, matchesLived).catch(() => {}), WAIT_BEFORE_SAVING_MS);
        return () => clearTimeout(timer);
    }, [loaded, fanId, profile, matchesLived]);

    // 2. Save every memory that is new or has changed (kept, shared, posted, photo uploaded).
    useEffect(() => {
        if (!loaded) return;
        memories.forEach((memory) => sendMemory(fanId, memory));
    }, [loaded, fanId, memories]);
}
