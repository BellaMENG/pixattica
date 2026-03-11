import { describe, expect, it } from "vitest";
import { getCommandCShortcutAction, getWindowIdToClose } from "./osShortcuts";
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

describe("getCommandCShortcutAction", () => {
    it("interrupts typed terminal input before closing windows", () => {
        expect(
            getCommandCShortcutAction({
                commandInput: "cl",
                focusedWindowId: "window-2",
                isPromptFocused: true,
                windows: WINDOWS,
            }),
        ).toEqual({ type: "interrupt-input" });
    });

    it("closes the focused window when there is no typed prompt input", () => {
        expect(
            getCommandCShortcutAction({
                commandInput: "",
                focusedWindowId: "window-1",
                isPromptFocused: false,
                windows: WINDOWS,
            }),
        ).toEqual({ type: "close-window", windowId: "window-1" });
    });

    it("returns none when there is no input and no open window", () => {
        expect(
            getCommandCShortcutAction({
                commandInput: "",
                focusedWindowId: null,
                isPromptFocused: false,
                windows: [],
            }),
        ).toEqual({ type: "none" });
    });
});
