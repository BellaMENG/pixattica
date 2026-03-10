import { describe, expect, it } from "vitest";
import { getWindowIdToClose } from "./osShortcuts";
import type { OsWindow } from "./osWindowing";

const WINDOWS: OsWindow[] = [
    {
        id: "window-1",
        moduleId: "books",
        frame: { x: 0, y: 0, width: 500, height: 400 },
    },
    {
        id: "window-2",
        moduleId: "cats",
        frame: { x: 20, y: 20, width: 520, height: 420 },
    },
];

describe("getWindowIdToClose", () => {
    it("returns the focused window when one is focused", () => {
        expect(getWindowIdToClose("window-1", WINDOWS)).toBe("window-1");
    });

    it("returns the topmost window when the shell is focused", () => {
        expect(getWindowIdToClose(null, WINDOWS)).toBe("window-2");
    });

    it("returns null when no windows are open", () => {
        expect(getWindowIdToClose(null, [])).toBeNull();
    });
});
