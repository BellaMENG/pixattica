import { describe, expect, it } from "vitest";
import { createOsStore, INITIAL_OS_STATE } from "./osStore";

const SHELL_BOUNDS = {
    width: 1280,
    height: 920,
};

describe("osStore window manager", () => {
    it("keeps one instance per app", () => {
        const store = createOsStore();

        expect(store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS)).toBe("opened");
        expect(store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS)).toBe("focused");

        expect(store.getState().windows).toHaveLength(1);
        expect(store.getState().windows[0]?.moduleId).toBe("cats");
    });

    it("preserves a resized frame when refocusing an existing app", () => {
        const store = createOsStore();

        store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS);
        const catsWindow = store.getState().windows[0];
        expect(catsWindow).toBeDefined();

        const resizedFrame = {
            ...catsWindow.frame,
            width: catsWindow.frame.width - 140,
            height: catsWindow.frame.height - 120,
        };

        store.getState().updateWindowFrame(catsWindow.id, resizedFrame, SHELL_BOUNDS);
        store.getState().focusOrOpenWindow("books", SHELL_BOUNDS);
        store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS);

        const refocusedCatsWindow = store
            .getState()
            .windows.find((windowItem) => windowItem.moduleId === "cats");

        expect(refocusedCatsWindow?.frame).toEqual(resizedFrame);
        expect(store.getState().windows).toHaveLength(2);
    });

    it("keeps actions wired to the same store after resetting initial state", () => {
        const store = createOsStore();

        store.setState(INITIAL_OS_STATE);
        expect(store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS)).toBe("opened");

        expect(store.getState().windows).toHaveLength(1);
        expect(store.getState().windows[0]?.moduleId).toBe("cats");
    });
});
