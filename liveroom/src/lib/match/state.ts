// Builds the scoreboard (score, overs, chase, batters, last 6 balls) up to a given ball.
// Why: it is pure, so the same ball always gives the same score and it is easy to test.

import type { Ball, BatterLine, MatchInfo, MatchState } from './types';

const BALLS_PER_INNINGS = 120;

export const oversText = (legal: number) => `${Math.floor(legal / 6)}.${legal % 6}`;

export function computeState(balls: Ball[], index: number, info: MatchInfo): MatchState {
    const upto = balls.slice(0, index + 1);
    const last = upto[upto.length - 1];
    const innings: 1 | 2 = last?.innings ?? 1;

    const firstTotal = balls.filter((b) => b.innings === 1).reduce((s, b) => s + b.runsTotal, 0);
    const inn = upto.filter((b) => b.innings === innings);

    let runs = 0;
    let wickets = 0;
    let legal = 0;
    const bat = new Map<string, { runs: number; balls: number }>();
    const bowl = new Map<string, { runs: number; wickets: number }>();

    for (const b of inn) {
        runs += b.runsTotal;
        if (!b.isWide && !b.isNoBall) legal++;

        const s = bat.get(b.batter) ?? { runs: 0, balls: 0 };
        s.runs += b.runsBatter;
        if (!b.isWide) s.balls++;
        bat.set(b.batter, s);
        if (!bat.has(b.nonStriker)) bat.set(b.nonStriker, { runs: 0, balls: 0 });

        const bw = bowl.get(b.bowler) ?? { runs: 0, wickets: 0 };
        bw.runs += b.runsTotal;
        if (b.wicket) {
            wickets++;
            if (b.wicket.kind !== 'run out') bw.wickets++;
        }
        bowl.set(b.bowler, bw);
    }

    const next = balls[index + 1];
    const striker = next && next.innings === innings ? next.batter : last?.batter;
    const pair = last ? [last.batter, last.nonStriker].filter((n) => n !== last.wicket?.playerOut) : [];
    const batters: BatterLine[] = pair.map((name) => ({
        name,
        runs: bat.get(name)?.runs ?? 0,
        balls: bat.get(name)?.balls ?? 0,
        onStrike: name === striker,
    }));

    const bowlerName = last?.bowler ?? '';
    const bowler = { name: bowlerName, ...(bowl.get(bowlerName) ?? { runs: 0, wickets: 0 }) };

    const last6 = inn.slice(-6).map((b) => (b.wicket ? 'W' : String(b.runsTotal)));

    const state: MatchState = {
        innings,
        battingTeam: info.teams[innings - 1],
        bowlingTeam: info.teams[innings === 1 ? 1 : 0],
        runs,
        wickets,
        oversText: oversText(legal),
        legalBallsBowled: legal,
        batters,
        bowler,
        last6,
        currentRate: legal ? (runs * 6) / legal : 0,
        isOver: balls.length > 0 && index >= balls.length - 1,
    };

    if (innings === 2) {
        const target = firstTotal + 1;
        const ballsLeft = BALLS_PER_INNINGS - legal;
        state.target = target;
        state.runsNeeded = Math.max(0, target - runs);
        state.ballsLeft = ballsLeft;
        state.requiredRate = ballsLeft > 0 ? (state.runsNeeded * 6) / ballsLeft : 0;
    }

    if (state.isOver) {
        const [first, second] = info.teams.map((t) => info.short[t] ?? t);
        if (runs >= firstTotal + 1) {
            const w = 10 - wickets;
            state.result = `${second} won by ${w} wicket${w === 1 ? '' : 's'}`;
        } else {
            const r = firstTotal - runs;
            state.result = r === 0 ? 'Match tied' : `${first} won by ${r} run${r === 1 ? '' : 's'}`;
        }
    }

    return state;
}
