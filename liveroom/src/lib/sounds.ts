// The meme sound board: named sounds that roasts and big moments can play.
// Why: the AI and the friend's phone only ever pass a name, so swapping a clip means replacing one file.

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useRoar } from '@/lib/store';
import SOUND_INFO from '@/data/sounds.json';

// To change a sound, replace the file in assets/sounds/ and keep the same name.
// Keep these names the same as the keys in src/data/sounds.json.
const FILES = {
    faaah: require('../../assets/sounds/faaah.mp3'),
    shocked: require('../../assets/sounds/shocked.mp3'),
    bruh: require('../../assets/sounds/bruh.mp3'),
    'emotional-damage': require('../../assets/sounds/emotional-damage.mp3'),
    slap: require('../../assets/sounds/slap.mp3'),
    'cat-laugh': require('../../assets/sounds/cat-laugh.mp3'),
    'baby-laugh': require('../../assets/sounds/baby-laugh.mp3'),
    'chicken-scream': require('../../assets/sounds/chicken-scream.mp3'),
    nuagh: require('../../assets/sounds/nuagh.mp3'),
    galaxy: require('../../assets/sounds/galaxy.mp3'),
    nemesis: require('../../assets/sounds/nemesis.mp3'),
    'meri-jung': require('../../assets/sounds/meri-jung.mp3'),
    mystery: require('../../assets/sounds/mystery.mp3'),
};

export type SoundName = keyof typeof FILES;
export const SOUND_NAMES = Object.keys(FILES) as SoundName[];

// Names, labels and moods live in src/data/sounds.json (the server and AI read the same file).
export const SOUND_LABEL = Object.fromEntries(Object.entries(SOUND_INFO).map(([name, info]) => [name, info.label])) as Record<SoundName, string>;

export const isSoundName = (value: unknown): value is SoundName => typeof value === 'string' && value in FILES;

// One player per sound, made the first time it plays and reused after that.
const players: Partial<Record<SoundName, AudioPlayer>> = {};
// Some meme clips run 10-20 seconds; banter only needs the punch, so we cut them off.
const MAX_SOUND_MS = 6000;
const stopTimers: Partial<Record<SoundName, ReturnType<typeof setTimeout>>> = {};
let modeSet = false;

export function playSound(name: SoundName | undefined | null) {
    if (!name || !isSoundName(name) || !useRoar.getState().profile.sounds) return;
    try {
        if (!modeSet) {
            modeSet = true;
            // Sound effects: play even on silent, and don't stop the TV/music app.
            setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
        }
        const player = (players[name] ??= createAudioPlayer(FILES[name]));
        player.seekTo(0).catch(() => {});
        player.play();
        clearTimeout(stopTimers[name]);
        stopTimers[name] = setTimeout(() => player.pause(), MAX_SOUND_MS);
    } catch {
        // A sound failing must never break the match screen.
    }
}

// A friend's voice roast, streamed from the server. Only one plays at a time.
let voicePlayer: AudioPlayer | null = null;

export function playVoice(url: string) {
    if (!useRoar.getState().profile.sounds) return;
    try {
        voicePlayer?.remove();
        voicePlayer = createAudioPlayer({ uri: url });
        voicePlayer.play();
    } catch {
        // A clip that can't play (old browser, bad network) is skipped quietly.
    }
}

// Good moment for you → celebrate; bad moment → the classic "it's over" sounds.
export function soundForMoment(kind: string, goodForMe: boolean): SoundName {
    if (kind === 'result') return goodForMe ? 'nemesis' : 'meri-jung';
    if (kind === 'wicket') return goodForMe ? 'emotional-damage' : 'faaah';
    if (kind === 'six') return goodForMe ? 'galaxy' : 'shocked';
    return goodForMe ? 'cat-laugh' : 'bruh';
}
