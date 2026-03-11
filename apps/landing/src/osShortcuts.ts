import type { OsWindow } from "./osWindowing";

export function getWindowIdToClose(
    focusedWindowId: string | null,
    windows: OsWindow[],
): string | null {
    if (focusedWindowId) {
        return focusedWindowId;
    }

    return windows[windows.length - 1]?.id ?? null;
}

type CommandCShortcutContext = {
    commandInput: string;
    focusedWindowId: string | null;
    isPromptFocused: boolean;
    windows: OsWindow[];
};

export type CommandCShortcutAction =
    | { type: "interrupt-input" }
    | { type: "close-window"; windowId: string }
    | { type: "none" };

export function getCommandCShortcutAction({
    commandInput,
    focusedWindowId,
    isPromptFocused,
    windows,
}: CommandCShortcutContext): CommandCShortcutAction {
    if (isPromptFocused && commandInput.length > 0) {
        return { type: "interrupt-input" };
    }

    const windowId = getWindowIdToClose(focusedWindowId, windows);
    if (windowId) {
        return { type: "close-window", windowId };
    }

    return { type: "none" };
}
