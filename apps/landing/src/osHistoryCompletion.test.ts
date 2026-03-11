import { describe, expect, it } from "vitest";
import { getHistoryInlineCompletion } from "./osHistoryCompletion";

describe("getHistoryInlineCompletion", () => {
    it("returns the most recent matching command from history", () => {
        expect(
            getHistoryInlineCompletion("cl", ["help", "clear", "collage", "clear all", "clear"]),
        ).toBe("clear");
    });

    it("supports multi-word command prefixes", () => {
        expect(getHistoryInlineCompletion("open c", ["open books", "open collage"])).toBe(
            "open collage",
        );
    });

    it("returns null for empty or exact matches", () => {
        expect(getHistoryInlineCompletion("", ["clear"])).toBeNull();
        expect(getHistoryInlineCompletion("clear", ["clear"])).toBeNull();
    });
});
