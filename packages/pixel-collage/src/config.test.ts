import { describe, it, expect } from "vitest";
import { CANVAS_ASPECT_RATIO, CANVAS_FIT_PADDING } from "./config";

describe("CANVAS_ASPECT_RATIO", () => {
    it("is 4/3", () => {
        expect(CANVAS_ASPECT_RATIO).toBe(4 / 3);
    });
});

describe("CANVAS_FIT_PADDING", () => {
    it("is 24", () => {
        expect(CANVAS_FIT_PADDING).toBe(24);
    });
});
