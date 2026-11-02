// Works out which ball we are on from the start time, speed and TV delay.
// Why: every screen uses the same clock, so nothing drifts or spoils a moment.

export type ClockConfig = {
    startedAt: number;
    startIndex: number;
    msPerBall: number;
    delayMs: number;
    inningsBreakMs: number;
    firstInningsBalls: number;
};

export function currentBallIndex(cfg: ClockConfig, now: number, totalBalls: number): number {
    const elapsed = now - cfg.startedAt - cfg.delayMs;
    if (elapsed < 0) return cfg.startIndex - 1;

    let idx = cfg.startIndex - 1 + Math.floor(elapsed / cfg.msPerBall);

    const lastOfFirst = cfg.firstInningsBalls - 1;
    if (cfg.startIndex <= lastOfFirst && idx > lastOfFirst) {
        const breakBalls = Math.ceil(cfg.inningsBreakMs / cfg.msPerBall);
        idx = Math.max(lastOfFirst, idx - breakBalls);
    }

    return Math.min(idx, totalBalls - 1);
}
