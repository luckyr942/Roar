// Finds the fours, sixes, wickets and the result in the match.
// Why: these moments drive the feed, army points, camera capture and roasts.

import type { Ball, MatchInfo, Team } from '@/lib/match/types';
import { computeState } from '@/lib/match/state';

export type MomentKind = 'four' | 'six' | 'wicket' | 'result';

export type Moment = {
    id: string;
    ballIndex: number;
    kind: MomentKind;
    label: string;
    headline: string;
    title: string;
    detail: string;
    outcome?: string;
    overText: string;
    team: Team;
    points: number;
};

const POINTS: Record<MomentKind, number> = { four: 2, six: 3, wicket: 4, result: 10 };

function describe(ball: Ball) {
    if (ball.wicket) {
        const runOut = ball.wicket.kind === 'run out';
        return {
            label: runOut ? 'RUN OUT' : 'WICKET',
            headline: runOut ? 'RUN OUT!' : 'WICKET!',
            title: runOut ? `${ball.wicket.playerOut} run out` : `${ball.wicket.playerOut} ${ball.wicket.kind} · b ${ball.bowler}`,
        };
    }
    if (ball.runsBatter === 6) return { label: 'SIX', headline: 'SIX!', title: `${ball.batter} off ${ball.bowler}` };
    if (ball.runsBatter === 4) return { label: 'FOUR', headline: 'FOUR!', title: `${ball.batter} off ${ball.bowler}` };
    return null;
}

export function detectMoment(ball: Ball, balls: Ball[], info: MatchInfo): Moment | null {
    const isLast = ball.index === balls.length - 1;
    const what = describe(ball);
    if (!what && !isLast) return null;

    const state = computeState(balls, ball.index, info);
    const short = (t: string) => info.short[t];
    const overText = `${ball.over}.${ball.legalBall}`;
    const base = {
        id: `m-${ball.index}`,
        ballIndex: ball.index,
        overText,
        detail: `${overText} · ${short(state.battingTeam)} ${state.runs}/${state.wickets}`,
    };

    if (isLast) {
        const result = state.result ?? '';
        return {
            ...base,
            kind: 'result',
            label: what?.label ?? 'RESULT',
            headline: what?.headline ?? 'FULL TIME',
            title: what?.title ?? `${ball.batter} off ${ball.bowler}`,
            outcome: result,
            team: result.split(' ')[0] as Team,
            points: POINTS.result,
        };
    }

    const kind: MomentKind = ball.wicket ? 'wicket' : ball.runsBatter === 6 ? 'six' : 'four';
    return {
        ...base,
        ...what!,
        kind,
        team: kind === 'wicket' ? short(state.bowlingTeam) : short(state.battingTeam),
        points: POINTS[kind],
    };
}

export function detectAll(balls: Ball[], info: MatchInfo): Moment[] {
    return balls.map((b) => detectMoment(b, balls, info)).filter((m): m is Moment => m !== null);
}
