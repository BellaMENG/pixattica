import { describe, expect, it } from "vitest";
import {
    advanceCursorFrame,
    shouldEnableAnimatedCursor,
    updateCursorPerformanceState,
} from "../../../packages/ui/src/animatedCursorUtils";

describe("shouldEnableAnimatedCursor", () => {
    it("enables the custom cursor only for fine hover pointers without reduced motion", () => {
        expect(
            shouldEnableAnimatedCursor({
                hasFinePointer: true,
                hasHover: true,
                lowPowerMode: false,
                prefersReducedMotion: false,
            }),
        ).toBe(true);
    });

    it("disables the custom cursor when reduced motion is preferred", () => {
        expect(
            shouldEnableAnimatedCursor({
                hasFinePointer: true,
                hasHover: true,
                lowPowerMode: false,
                prefersReducedMotion: true,
            }),
        ).toBe(false);
    });

    it("disables the custom cursor on coarse or non-hover devices", () => {
        expect(
            shouldEnableAnimatedCursor({
                hasFinePointer: false,
                hasHover: true,
                lowPowerMode: false,
                prefersReducedMotion: false,
            }),
        ).toBe(false);
        expect(
            shouldEnableAnimatedCursor({
                hasFinePointer: true,
                hasHover: false,
                lowPowerMode: false,
                prefersReducedMotion: false,
            }),
        ).toBe(false);
    });

    it("disables the custom cursor in low-power mode", () => {
        expect(
            shouldEnableAnimatedCursor({
                hasFinePointer: true,
                hasHover: true,
                lowPowerMode: true,
                prefersReducedMotion: false,
            }),
        ).toBe(false);
    });
});

describe("advanceCursorFrame", () => {
    it("keeps the same frame until enough time has elapsed", () => {
        expect(
            advanceCursorFrame({
                currentFrame: 2,
                elapsedMs: 90,
                frameCount: 7,
                frameDuration: 166,
            }),
        ).toEqual({
            currentFrame: 2,
            frameAdvance: 0,
            remainingMs: 90,
        });
    });

    it("advances multiple frames when a render loop catches up", () => {
        expect(
            advanceCursorFrame({
                currentFrame: 5,
                elapsedMs: 400,
                frameCount: 7,
                frameDuration: 100,
            }),
        ).toEqual({
            currentFrame: 2,
            frameAdvance: 4,
            remainingMs: 0,
        });
    });
});

describe("updateCursorPerformanceState", () => {
    it("stays enabled while frames remain within budget", () => {
        expect(
            updateCursorPerformanceState({
                slowFrameCount: 1,
                frameDeltaMs: 20,
                slowFrameThresholdMs: 40,
                slowFrameLimit: 3,
            }),
        ).toEqual({
            shouldFallbackToNativeCursor: false,
            slowFrameCount: 0,
        });
    });

    it("falls back after repeated slow frames", () => {
        expect(
            updateCursorPerformanceState({
                slowFrameCount: 2,
                frameDeltaMs: 45,
                slowFrameThresholdMs: 40,
                slowFrameLimit: 3,
            }),
        ).toEqual({
            shouldFallbackToNativeCursor: true,
            slowFrameCount: 3,
        });
    });
});
