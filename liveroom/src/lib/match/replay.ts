// Turns the Cricsheet match file into one flat list of balls.
// Why: with one list, "where are we in the match" is just one number.

import type { Ball, MatchInfo, Team } from './types';
import raw from '@/data/ipl2019-final-mi-csk.json';

// Only the Cricsheet fields we use.
type Delivery = {
    batter: string;
    bowler: string;
    non_striker: string;
    runs: { batter: number; extras: number; total: number };
    extras?: { wides?: number; noballs?: number; byes?: number; legbyes?: number };
    wickets?: { player_out: string; kind: string }[];
};

type CricsheetMatch = {
    info: { venue: string; dates: string[]; event?: { name?: string; stage?: string } };
    innings: { team: string; overs: { over: number; deliveries: Delivery[] }[] }[];
};

const match = raw as unknown as CricsheetMatch;

const SHORT: Record<string, Team> = {
    'Mumbai Indians': 'MI',
    'Chennai Super Kings': 'CSK',
};

export function getMatchInfo(): MatchInfo {
    const { info, innings } = match;
    return {
        id: 'ipl-2019-final',
        title: `IPL ${info.dates[0].slice(0, 4)} ${info.event?.stage ?? 'Match'}`,
        teams: [innings[0].team, innings[1].team], // batting order
        short: SHORT,
        venue: info.venue,
        date: info.dates[0],
    };
}

export function getBalls(): Ball[] {
    const balls: Ball[] = [];

    match.innings.forEach((inn, i) => {
        for (const over of inn.overs) {
            let legal = 0;
            for (const d of over.deliveries) {
                const isWide = Boolean(d.extras?.wides);
                const isNoBall = Boolean(d.extras?.noballs);
                if (!isWide && !isNoBall) legal++;

                const w = d.wickets?.[0];
                balls.push({
                    index: balls.length,
                    innings: (i + 1) as 1 | 2,
                    over: over.over,
                    legalBall: legal,
                    batter: d.batter,
                    nonStriker: d.non_striker,
                    bowler: d.bowler,
                    runsBatter: d.runs.batter,
                    runsExtras: d.runs.extras,
                    runsTotal: d.runs.total,
                    isWide,
                    isNoBall,
                    wicket: w ? { playerOut: w.player_out, kind: w.kind } : undefined,
                });
            }
        }
    });

    return balls;
}
