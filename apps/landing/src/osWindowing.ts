import type { AppId } from "./osData";

export type AppWindowFrame = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type WindowBounds = {
    width: number;
    height: number;
};

export type OsWindow = {
    frame: AppWindowFrame;
    id: string;
    moduleId: AppId;
};

export const MOBILE_BREAKPOINT = 640;
const WINDOW_EDGE_GAP = 12;
const DEFAULT_MIN_APP_WINDOW_WIDTH = 520;
const DEFAULT_MIN_APP_WINDOW_HEIGHT = 360;
const ABOUT_MIN_APP_WINDOW_WIDTH = 520;
const ABOUT_MIN_APP_WINDOW_HEIGHT = 210;
const DEFAULT_APP_WINDOW_FRAME: AppWindowFrame = {
    x: 72,
    y: 42,
    width: 860,
    height: 620,
};
const ABOUT_APP_WINDOW_FRAME: AppWindowFrame = {
    x: 72,
    y: 42,
    width: 520,
    height: 210,
};

function getWindowMinimums(appId: AppId) {
    if (appId === "about") {
        return {
            minHeight: ABOUT_MIN_APP_WINDOW_HEIGHT,
            minWidth: ABOUT_MIN_APP_WINDOW_WIDTH,
        };
    }

    return {
        minHeight: DEFAULT_MIN_APP_WINDOW_HEIGHT,
        minWidth: DEFAULT_MIN_APP_WINDOW_WIDTH,
    };
}

function clampValue(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function clampWindowFrame(
    frame: AppWindowFrame,
    bounds: WindowBounds,
    appId: AppId,
): AppWindowFrame {
    if (bounds.width <= MOBILE_BREAKPOINT) {
        return {
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height,
        };
    }

    const { minHeight, minWidth } = getWindowMinimums(appId);
    const maxWidth = Math.max(minWidth, bounds.width - WINDOW_EDGE_GAP * 2);
    const maxHeight = Math.max(minHeight, bounds.height - WINDOW_EDGE_GAP * 2);
    const width = clampValue(frame.width, minWidth, maxWidth);
    const height = clampValue(frame.height, minHeight, maxHeight);
    const x = clampValue(frame.x, WINDOW_EDGE_GAP, bounds.width - width - WINDOW_EDGE_GAP);
    const y = clampValue(frame.y, WINDOW_EDGE_GAP, bounds.height - height - WINDOW_EDGE_GAP);

    return { x, y, width, height };
}

export function getPreferredWindowFrame(
    appId: AppId,
    bounds: WindowBounds,
    options?: { index?: number },
): AppWindowFrame {
    if (appId === "collage") {
        return clampWindowFrame(
            {
                x: WINDOW_EDGE_GAP,
                y: WINDOW_EDGE_GAP,
                width: bounds.width - WINDOW_EDGE_GAP * 2,
                height: bounds.height - WINDOW_EDGE_GAP * 2,
            },
            bounds,
            appId,
        );
    }

    const offsetIndex = options?.index ?? 0;
    const baseFrame = appId === "about" ? ABOUT_APP_WINDOW_FRAME : DEFAULT_APP_WINDOW_FRAME;
    const offsetFrame = {
        ...baseFrame,
        x: baseFrame.x + offsetIndex * 28,
        y: baseFrame.y + offsetIndex * 20,
    };

    return clampWindowFrame(offsetFrame, bounds, appId);
}
