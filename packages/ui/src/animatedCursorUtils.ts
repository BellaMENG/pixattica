export interface CursorCapabilityOptions {
    hasFinePointer: boolean;
    hasHover: boolean;
    lowPowerMode: boolean;
    prefersReducedMotion: boolean;
}

export interface CursorFrameAdvanceOptions {
    currentFrame: number;
    elapsedMs: number;
    frameCount: number;
    frameDuration: number;
}

export interface CursorPerformanceStateOptions {
    frameDeltaMs: number;
    slowFrameCount: number;
    slowFrameLimit: number;
    slowFrameThresholdMs: number;
}

export function shouldEnableAnimatedCursor({
    hasFinePointer,
    hasHover,
    lowPowerMode,
    prefersReducedMotion,
}: CursorCapabilityOptions) {
    return hasFinePointer && hasHover && !prefersReducedMotion && !lowPowerMode;
}

export function advanceCursorFrame({
    currentFrame,
    elapsedMs,
    frameCount,
    frameDuration,
}: CursorFrameAdvanceOptions) {
    const frameAdvance = Math.floor(elapsedMs / frameDuration);

    return {
        currentFrame: frameAdvance > 0 ? (currentFrame + frameAdvance) % frameCount : currentFrame,
        frameAdvance,
        remainingMs: elapsedMs - frameAdvance * frameDuration,
    };
}

export function updateCursorPerformanceState({
    frameDeltaMs,
    slowFrameCount,
    slowFrameLimit,
    slowFrameThresholdMs,
}: CursorPerformanceStateOptions) {
    const nextSlowFrameCount = frameDeltaMs >= slowFrameThresholdMs ? slowFrameCount + 1 : 0;

    return {
        shouldFallbackToNativeCursor: nextSlowFrameCount >= slowFrameLimit,
        slowFrameCount: nextSlowFrameCount,
    };
}
