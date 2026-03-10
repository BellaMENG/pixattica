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
