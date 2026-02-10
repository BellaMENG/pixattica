import { describe, it, expect, afterEach, vi } from "vitest";
import {
    CanvasSizeId,
    CANVAS_SIZES,
    CANVAS_FIT_PADDING,
    CANVAS_TIER_BREAKPOINT_MEDIUM,
    CANVAS_TIER_BREAKPOINT_LARGE,
    detectCanvasSizeId,
} from "./config";

describe("CANVAS_SIZES", () => {
    it("contains exactly 6 presets", () => {
        expect(CANVAS_SIZES).toHaveLength(6);
    });

    it("has unique ids for each preset", () => {
        const ids = CANVAS_SIZES.map((s) => s.id);
        expect(new Set(ids).size).toBe(6);
    });

    it("contains the expected dimensions for each tier and orientation", () => {
        const findSize = (id: CanvasSizeId) => CANVAS_SIZES.find((s) => s.id === id)!;

        expect(findSize(CanvasSizeId.SmallLandscape)).toMatchObject({ width: 800, height: 600 });
        expect(findSize(CanvasSizeId.SmallPortrait)).toMatchObject({ width: 600, height: 800 });
        expect(findSize(CanvasSizeId.MediumLandscape)).toMatchObject({ width: 1200, height: 900 });
        expect(findSize(CanvasSizeId.MediumPortrait)).toMatchObject({ width: 900, height: 1200 });
        expect(findSize(CanvasSizeId.LargeLandscape)).toMatchObject({ width: 1600, height: 1200 });
        expect(findSize(CanvasSizeId.LargePortrait)).toMatchObject({ width: 1200, height: 1600 });
    });

    it("is ordered as landscape-first per tier for grid layout", () => {
        const ids = CANVAS_SIZES.map((s) => s.id);
        expect(ids).toEqual([
            CanvasSizeId.SmallLandscape,
            CanvasSizeId.MediumLandscape,
            CanvasSizeId.LargeLandscape,
            CanvasSizeId.SmallPortrait,
            CanvasSizeId.MediumPortrait,
            CanvasSizeId.LargePortrait,
        ]);
    });
});

describe("CANVAS_FIT_PADDING", () => {
    it("is 24", () => {
        expect(CANVAS_FIT_PADDING).toBe(24);
    });
});

describe("breakpoint constants", () => {
    it("medium breakpoint is 1024", () => {
        expect(CANVAS_TIER_BREAKPOINT_MEDIUM).toBe(1024);
    });

    it("large breakpoint is 1536", () => {
        expect(CANVAS_TIER_BREAKPOINT_LARGE).toBe(1536);
    });
});

describe("detectCanvasSizeId", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function mockViewport(width: number, height: number) {
        vi.spyOn(window, "innerWidth", "get").mockReturnValue(width);
        vi.spyOn(window, "innerHeight", "get").mockReturnValue(height);
    }

    it("returns SmallLandscape for a small landscape viewport", () => {
        mockViewport(800, 600);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.SmallLandscape);
    });

    it("returns SmallPortrait for a small portrait viewport", () => {
        mockViewport(600, 800);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.SmallPortrait);
    });

    it("returns MediumLandscape for a medium landscape viewport", () => {
        mockViewport(1200, 900);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.MediumLandscape);
    });

    it("returns MediumPortrait for a medium portrait viewport", () => {
        mockViewport(900, 1200);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.MediumPortrait);
    });

    it("returns LargeLandscape for a large landscape viewport", () => {
        mockViewport(1920, 1080);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.LargeLandscape);
    });

    it("returns LargePortrait for a large portrait viewport", () => {
        mockViewport(1080, 1920);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.LargePortrait);
    });

    it("treats a square viewport as landscape", () => {
        mockViewport(1024, 1024);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.MediumLandscape);
    });

    it("uses the larger dimension for tier detection", () => {
        mockViewport(500, 1600);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.LargePortrait);
    });

    it("returns SmallLandscape at the boundary just below medium", () => {
        mockViewport(1023, 768);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.SmallLandscape);
    });

    it("returns MediumLandscape at exactly the medium breakpoint", () => {
        mockViewport(1024, 768);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.MediumLandscape);
    });

    it("returns MediumLandscape at the boundary just below large", () => {
        mockViewport(1535, 900);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.MediumLandscape);
    });

    it("returns LargeLandscape at exactly the large breakpoint", () => {
        mockViewport(1536, 900);
        expect(detectCanvasSizeId()).toBe(CanvasSizeId.LargeLandscape);
    });
});
