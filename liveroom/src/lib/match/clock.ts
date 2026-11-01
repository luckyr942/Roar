// Works out which ball we are on from the start time, speed and TV delay.
// Why: every screen uses the same clock, so nothing drifts or spoils a moment.

export type ClockConfig = {
    startedAt: number; // Date.now() when this run started
    startIndex: number; // first ball of this run (0, or the last over for the demo)
    msPerBall: number; // 4000 = 1x, 1000 = 4x
    delayMs: number; // 0..30000
    inningsBreakMs: number;
    firstInningsBalls: number;
};

// Returns the index of the last ball bowled, or startIndex - 1 if none yet.
export function currentBallIndex(cfg: ClockConfig, now: number, totalBalls: number): number {
    const elapsed = now - cfg.startedAt - cfg.delayMs;
    if (elapsed < 0) return cfg.startIndex - 1;

    let idx = cfg.startIndex - 1 + Math.floor(elapsed / cfg.msPerBall);

    // Pause once at the innings break if this run crosses it.
    const lastOfFirst = cfg.firstInningsBalls - 1;
    if (cfg.startIndex <= lastOfFirst && idx > lastOfFirst) {
        const breakBalls = Math.ceil(cfg.inningsBreakMs / cfg.msPerBall);
        idx = Math.max(lastOfFirst, idx - breakBalls);
    }

    return Math.min(idx, totalBalls - 1);
}
