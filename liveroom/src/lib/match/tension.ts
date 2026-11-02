// Scores how tense the match is from 0 to 100, and when the camera should arm.
// Why: the camera should only switch on when it really matters.

import type { Ball, MatchState } from './types';

const BALLS_PER_INNINGS = 120;

export const ARM_CAMERA_AT = 75;
export const BIG_MOMENT_AT = 85;

export function tension(state: MatchState, ball: Ball | null): number {
    if (state.isOver) return 0;

    let spike = 0;
    if (ball?.wicket) spike = 10;
    else if (ball && ball.runsBatter >= 4) spike = 5;

    if (state.innings === 1) return Math.min(100, 15 + spike * 2);

    const ballsLeft = state.ballsLeft ?? BALLS_PER_INNINGS;
    const rrr = state.requiredRate ?? 0;

    const lateness = 1 - ballsLeft / BALLS_PER_INNINGS;
    const balance = rrr <= 0 ? 0 : 1 - Math.min(1, Math.max(0, Math.abs(rrr - 9) - 3) / 9);
    const fallen = state.wickets / 10;

    const score = lateness * 40 + balance * 35 + fallen * 15 + spike;
    return Math.round(Math.max(0, Math.min(100, score)));
}

export function tensionLabel(t: number): string {
    if (t >= ARM_CAMERA_AT) return '🔴 ARMED';
    if (t >= 50) return 'on the edge';
    if (t >= 25) return 'building';
    return 'calm';
}
