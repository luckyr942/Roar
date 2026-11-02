// The meme sound board: named sounds that roasts and big moments can play.
// Why: the AI and the friend's phone only ever pass a name, so swapping a clip means replacing one file.

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useRoar } from '@/lib/store';
import SOUND_INFO from '@/data/sounds.json';

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

export const SOUND_LABEL = Object.fromEntries(Object.entries(SOUND_INFO).map(([name, info]) => [name, info.label])) as Record<SoundName, string>;

export const isSoundName = (value: unknown): value is SoundName => typeof value === 'string' && value in FILES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
const MAX_SOUND_MS = 6000;
const stopTimers: Partial<Record<SoundName, ReturnType<typeof setTimeout>>> = {};
let modeSet = false;

export function playSound(name: SoundName | undefined | null) {
    if (!name || !isSoundName(name) || !useRoar.getState().profile.sounds) return;
    try {
        if (!modeSet) {
            modeSet = true;
            setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
        }
        const player = (players[name] ??= createAudioPlayer(FILES[name]));
        player.seekTo(0).catch(() => {});
        player.play();
        clearTimeout(stopTimers[name]);
        stopTimers[name] = setTimeout(() => player.pause(), MAX_SOUND_MS);
    } catch {
    }
}

let voicePlayer: AudioPlayer | null = null;

export function playVoice(url: string) {
    if (!useRoar.getState().profile.sounds) return;
    try {
        voicePlayer?.remove();
        voicePlayer = createAudioPlayer({ uri: url });
        voicePlayer.play();
    } catch {
    }
}

export function soundForMoment(kind: string, goodForMe: boolean): SoundName {
    if (kind === 'result') return goodForMe ? 'nemesis' : 'meri-jung';
    if (kind === 'wicket') return goodForMe ? 'emotional-damage' : 'faaah';
    if (kind === 'six') return goodForMe ? 'galaxy' : 'shocked';
    return goodForMe ? 'cat-laugh' : 'bruh';
}
