// The heartbeat: every 250ms works out the current ball, scoreboard, tension and moments.
// Why: screens just read these values instead of doing the maths themselves.

import { useEffect, useMemo, useState } from 'react';
import { getBalls, getMatchInfo } from '@/lib/match/replay';
import { computeState } from '@/lib/match/state';
import { currentBallIndex } from '@/lib/match/clock';
import { tension } from '@/lib/match/tension';
import { detectAll } from '@/lib/moments/detect';
import type { Ball } from '@/lib/match/types';
import { useRoar } from '@/lib/store';

const MS_PER_BALL_1X = 4000;
const INNINGS_BREAK_MS = 6000;
const TICK_MS = 250;

export function useMatchEngine() {
    const balls = useMemo(() => getBalls(), []);
    const info = useMemo(() => getMatchInfo(), []);
    const firstInningsBalls = useMemo(() => balls.filter((b) => b.innings === 1).length, [balls]);
    const allMoments = useMemo(() => detectAll(balls, info), [balls, info]);

    const startedAt = useRoar((s) => s.startedAt);
    const startIndex = useRoar((s) => s.startIndex);
    const speed = useRoar((s) => s.speed);
    const delayMs = useRoar((s) => s.delayMs);

    const [index, setIndex] = useState(-1);

    useEffect(() => {
        if (startedAt === null) return;
        const cfg = {
            startedAt,
            startIndex,
            msPerBall: MS_PER_BALL_1X / speed,
            delayMs,
            inningsBreakMs: INNINGS_BREAK_MS,
            firstInningsBalls,
        };
        const tick = () => setIndex(currentBallIndex(cfg, Date.now(), balls.length));
        tick();
        const id = setInterval(tick, TICK_MS);
        return () => clearInterval(id);
    }, [startedAt, startIndex, speed, delayMs, firstInningsBalls, balls.length]);

    const state = useMemo(() => computeState(balls, index, info), [balls, index, info]);
    const ball = index >= 0 ? balls[index] : null;
    const tensionValue = useMemo(() => tension(state, ball), [state, ball]);
    // Moments so far, newest first.
    const moments = useMemo(() => allMoments.filter((m) => m.ballIndex <= index).reverse(), [allMoments, index]);

    return { balls, info, index, ball, state, tension: tensionValue, moments };
}

// First ball of the chase's last over (for the demo jump).
export function lastOverStartIndex(balls: Ball[]): number {
    const lastOver = Math.max(...balls.filter((b) => b.innings === 2).map((b) => b.over));
    return balls.findIndex((b) => b.innings === 2 && b.over === lastOver);
}
