// The shapes of the match data: Ball, MatchInfo, MatchState, Team.
// Why: one contract, so TypeScript catches mistakes everywhere at once.

export type Team = 'MI' | 'CSK';

export interface MatchInfo {
    id: string;
    title: string;
    teams: [string, string];
    short: Record<string, Team>;
    venue: string;
    date: string;
}

export interface Ball {
    index: number;
    innings: 1 | 2;
    over: number;
    legalBall: number;
    batter: string;
    nonStriker: string;
    bowler: string;
    runsBatter: number;
    runsExtras: number;
    runsTotal: number;
    isWide: boolean;
    isNoBall: boolean;
    wicket?: {
        playerOut: string;
        kind: string;
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
    oversText: string;
    legalBallsBowled: number;
    batters: BatterLine[];
    bowler: { name: string; runs: number; wickets: number };
    last6: string[];
    currentRate: number;
    target?: number;
    runsNeeded?: number;
    ballsLeft?: number;
    requiredRate?: number;
    result?: string;
    isOver: boolean;
}
