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

    it("opens bbs as a standard desktop window instead of the collage fullscreen frame", () => {
        const store = createOsStore();

        store.getState().focusOrOpenWindow("bbs", SHELL_BOUNDS);
        store.getState().focusOrOpenWindow("collage", SHELL_BOUNDS);

        const bbsWindow = store
            .getState()
            .windows.find((windowItem) => windowItem.moduleId === "bbs");
        const collageWindow = store
            .getState()
            .windows.find((windowItem) => windowItem.moduleId === "collage");

        expect(bbsWindow).toBeDefined();
        expect(collageWindow).toBeDefined();
        expect(bbsWindow?.frame.width).toBeLessThan(collageWindow?.frame.width ?? 0);
        expect(bbsWindow?.frame.height).toBeLessThan(collageWindow?.frame.height ?? 0);
        expect(bbsWindow?.frame.x).toBeGreaterThan(0);
        expect(bbsWindow?.frame.y).toBeGreaterThan(0);
    });

    it("opens about in a compact window that still differs from the larger app defaults", () => {
        const store = createOsStore();

        store.getState().focusOrOpenWindow("about", SHELL_BOUNDS);
        store.getState().focusOrOpenWindow("books", SHELL_BOUNDS);

        const aboutWindow = store
            .getState()
            .windows.find((windowItem) => windowItem.moduleId === "about");
        const booksWindow = store
            .getState()
            .windows.find((windowItem) => windowItem.moduleId === "books");

        expect(aboutWindow).toBeDefined();
        expect(booksWindow).toBeDefined();
        expect(aboutWindow?.frame.width).toBeLessThan(booksWindow?.frame.width ?? 0);
        expect(aboutWindow?.frame.height).toBeLessThan(booksWindow?.frame.height ?? 0);
    });

    it("keeps actions wired to the same store after resetting initial state", () => {
        const store = createOsStore();

        store.setState(INITIAL_OS_STATE);
        expect(store.getState().focusOrOpenWindow("cats", SHELL_BOUNDS)).toBe("opened");

        expect(store.getState().windows).toHaveLength(1);
        expect(store.getState().windows[0]?.moduleId).toBe("cats");
    });
});
