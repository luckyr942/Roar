// Gets AI-written caption + roasts for a moment from the ROAR server, falling back to the templates.
// Why: the screen shows template lines instantly, then swaps in the AI lines when they arrive.

import { useEffect, useState } from 'react';
import type { Moment } from '@/lib/moments/detect';
import { askAiBanter, hasServer } from '@/lib/api';
import { captionFor, roastsFor, type Fan, type Lang, type Spice } from './captions';
import { isSoundName, soundForMoment, type SoundName } from '@/lib/sounds';
import { isStickerName, stickersForMoment, type StickerName } from '@/lib/stickers';

export type Banter = {
    caption: string;
    roasts: Record<Spice, { top: string; bottom: string }>;
    sound: SoundName;
    stickers: StickerName[];
    byAI: boolean;
};

const templates = (moment: Moment, lang: Lang, fan: Fan): Banter => ({
    caption: captionFor(moment, lang, fan),
    roasts: roastsFor(moment, fan),
    sound: soundForMoment(moment.kind, moment.team === fan.team),
    stickers: stickersForMoment(moment.kind, moment.team === fan.team),
    byAI: false,
});

export async function banterFor(moment: Moment, lang: Lang, fan: Fan): Promise<Banter> {
    if (!hasServer()) return templates(moment, lang, fan);
    try {
        const tooSlow = new Promise<never>((_, fail) => setTimeout(() => fail(new Error('AI too slow')), 12000));
        const answer = await Promise.race([askAiBanter(moment, fan, lang), tooSlow]);
        const sound = isSoundName(answer.sound) ? answer.sound : soundForMoment(moment.kind, moment.team === fan.team);
        const picked = (answer.stickers ?? []).filter(isStickerName);
        const stickers = picked.length ? picked : stickersForMoment(moment.kind, moment.team === fan.team);
        return { caption: answer.caption, roasts: answer.roasts, sound, stickers, byAI: true };
    } catch {
        return templates(moment, lang, fan);
    }
}

export function useBanter(moment: Moment | null, lang: Lang, fan: Fan): Banter | null {
    const [banter, setBanter] = useState<Banter | null>(moment ? templates(moment, lang, fan) : null);

    useEffect(() => {
        if (!moment) {
            setBanter(null);
            return;
        }
        let stillHere = true;
        setBanter(templates(moment, lang, fan));
        banterFor(moment, lang, fan).then((answer) => {
            if (stillHere) setBanter(answer);
        });
        return () => {
            stillHere = false;
        };
    }, [moment, lang, fan.name, fan.team, fan.rival]);

    return banter;
}
