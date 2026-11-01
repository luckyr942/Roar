// Captions, roasts and hype for a moment (templates for now; the AI backend replaces them later).
// Why: keeping the shape fixed means the screens will not change when real AI is added.

import type { Team } from '@/lib/match/types';
import type { Moment } from '@/lib/moments/detect';

export type Lang = 'Hinglish' | 'English' | 'मराठी';
export const LANGS: Lang[] = ['Hinglish', 'English', 'मराठी'];

export type Spice = 'Mild' | 'Spicy' | 'Savage';
export const SPICES: Spice[] = ['Mild', 'Spicy', 'Savage'];

export type Fan = { name: string; team: Team; rival: string };

// Good for the fan's team → celebrate. Bad → heartbreak.
export function captionFor(moment: Moment, lang: Lang, fan: Fan): string {
    const good = moment.team === fan.team;
    const what = moment.title;
    if (lang === 'Hinglish') {
        return good
            ? `${what}! ${fan.name} sofa se seedha chhat tak`
            : `${what}... ${fan.name} ka dil toot gaya, phir bhi believe karta hai.`;
    }
    if (lang === 'मराठी') {
        return good ? `${what}! ${fan.name} चा जल्लोष थांबतच नाही` : `${what}... ${fan.name} चं मन तुटलं, पण आशा कायम.`;
    }
    return good ? `${what}! ${fan.name} completely lost it on the couch` : `${what}. ${fan.name} can't watch. Still believing.`;
}

// Three roast levels aimed at the rival (or at yourself, if the moment hurt).
export function roastsFor(moment: Moment, fan: Fan): Record<Spice, { top: string; bottom: string }> {
    const rival = fan.rival.toUpperCase();
    const good = moment.team === fan.team;
    const headline = moment.headline.replace('!', '');
    if (good) {
        return {
            Mild: { top: `${rival}: "EASY CHASE BRO"`, bottom: `${rival} AFTER ${headline}: "PHONE OFF"` },
            Spicy: { top: `${rival} BEFORE ${moment.overText}`, bottom: `${rival} AFTER ${moment.overText}` },
            Savage: { top: `${rival} BOOKED THE VICTORY PARTY`, bottom: 'NOW WATCHING THIS REPLAY ON LOOP' },
        };
    }
    return {
        Mild: { top: `ME: "WE'VE GOT THIS"`, bottom: `${headline}: "NO."` },
        Spicy: { top: `${rival} RIGHT NOW`, bottom: `ME PRETENDING I'M FINE` },
        Savage: { top: `${rival} SCREENSHOTTING THIS`, bottom: 'ME DELETING MY TWEETS' },
    };
}

// One line to send live to the rival's phone.
export function roastLine(moment: Moment, fan: Fan, spice: Spice = 'Spicy'): string {
    const r = roastsFor(moment, fan)[spice];
    return `${r.top} / ${r.bottom}`;
}

// Quick lines for the Banter screen when there's no moment to point at.
export const QUICK_LINES = [
    'Scoreboard check?',
    'Still think it was an easy chase?',
    'Keep your phone charged, you will need tissues.',
];

// How loud is this memory? Tension when it happened + how big the moment was.
export function hypeFor(moment: Moment, tensionAtMoment: number): number {
    return Math.min(99, Math.round(40 + tensionAtMoment * 0.5 + moment.points * 1.5));
}
