// Free 3D stickers (Microsoft Fluent Emoji, MIT licence) that roasts can carry to your friend.
// Why: like the sounds, only a sticker name travels; each phone shows its own copy of the picture.

import STICKER_INFO from '@/data/stickers.json';

// Keep these names the same as the keys in src/data/stickers.json.
export const STICKERS = {
    lol: require('../../assets/stickers/lol.png'),
    rofl: require('../../assets/stickers/rofl.png'),
    crying: require('../../assets/stickers/crying.png'),
    skull: require('../../assets/stickers/skull.png'),
    clown: require('../../assets/stickers/clown.png'),
    fire: require('../../assets/stickers/fire.png'),
    trophy: require('../../assets/stickers/trophy.png'),
    cricket: require('../../assets/stickers/cricket.png'),
    party: require('../../assets/stickers/party.png'),
    'mind-blown': require('../../assets/stickers/mind-blown.png'),
    scream: require('../../assets/stickers/scream.png'),
    heartbreak: require('../../assets/stickers/heartbreak.png'),
    goat: require('../../assets/stickers/goat.png'),
    crown: require('../../assets/stickers/crown.png'),
    popcorn: require('../../assets/stickers/popcorn.png'),
    hundred: require('../../assets/stickers/hundred.png'),
    melting: require('../../assets/stickers/melting.png'),
    lion: require('../../assets/stickers/lion.png'),
    duck: require('../../assets/stickers/duck.png'),
    rocket: require('../../assets/stickers/rocket.png'),
    zany: require('../../assets/stickers/zany.png'),
    eyes: require('../../assets/stickers/eyes.png'),
    nerd: require('../../assets/stickers/nerd.png'),
    sleeping: require('../../assets/stickers/sleeping.png'),
};

export type StickerName = keyof typeof STICKERS;
export const STICKER_NAMES = Object.keys(STICKERS) as StickerName[];
export const STICKER_MEANING = STICKER_INFO as Record<StickerName, string>;

export const isStickerName = (value: unknown): value is StickerName => typeof value === 'string' && value in STICKERS;

// Stickers that fit a moment, for when the AI isn't there to pick.
export function stickersForMoment(kind: string, goodForMe: boolean): StickerName[] {
    if (kind === 'result') return goodForMe ? ['trophy', 'crown', 'party'] : ['crying', 'heartbreak', 'melting'];
    if (kind === 'wicket') return goodForMe ? ['skull', 'clown', 'popcorn'] : ['scream', 'crying', 'heartbreak'];
    if (kind === 'six') return goodForMe ? ['rocket', 'fire', 'goat'] : ['mind-blown', 'melting', 'eyes'];
    return goodForMe ? ['lol', 'fire'] : ['eyes', 'sleeping'];
}

// A random handful, for the sticker storm button.
export function randomStickers(count: number): StickerName[] {
    return [...STICKER_NAMES].sort(() => Math.random() - 0.5).slice(0, count);
}
