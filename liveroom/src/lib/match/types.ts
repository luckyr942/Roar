// The shapes of the match data: Ball, MatchInfo, MatchState, Team.
// Why: one contract, so TypeScript catches mistakes everywhere at once.

export type Team = 'MI' | 'CSK';

export interface MatchInfo {
    id: string;
    title: string;
    teams: [string, string]; // batting order: [first, second]
    short: Record<string, Team>; // "Mumbai Indians" → "MI"
    venue: string;
    date: string;
}

export interface Ball {
    index: number;
    innings: 1 | 2;
    over: number; // 0-based, as in Cricsheet
    legalBall: number; // 1..6 within the over (wides/no-balls don't count)
    batter: string;
    nonStriker: string;
    bowler: string;
    runsBatter: number; // runs credited to the batter
    runsExtras: number; // wides, no-balls, byes, leg-byes
    runsTotal: number; // what goes on the scoreboard
    isWide: boolean;
    isNoBall: boolean;
    wicket?: {
        playerOut: string;
        kind: string; // "caught", "bowled", "run out", "lbw", ...
    };
}

export interface BatterLine {
    name: string;
    runs: number;
    balls: number;
    onStrike: boolean;
}

export interface MatchState {
    innings: 1 | 2;
    battingTeam: string;
    bowlingTeam: string;
    runs: number;
    wickets: number;
    oversText: string; // "15.2"
    legalBallsBowled: number;
    batters: BatterLine[];
    bowler: { name: string; runs: number; wickets: number };
    last6: string[]; // ["1", "4", "W", ...]
    currentRate: number;
    // 2nd innings only:
    target?: number;
    runsNeeded?: number;
    ballsLeft?: number;
    requiredRate?: number;
    // match end:
    result?: string; // "MI won by 1 run"
    isOver: boolean;
}
