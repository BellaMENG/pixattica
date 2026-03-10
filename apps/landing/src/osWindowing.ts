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
const MIN_APP_WINDOW_WIDTH = 520;
const MIN_APP_WINDOW_HEIGHT = 360;
const DEFAULT_APP_WINDOW_FRAME: AppWindowFrame = {
    x: 72,
    y: 42,
    width: 860,
    height: 620,
};

function clampValue(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function clampWindowFrame(frame: AppWindowFrame, bounds: WindowBounds): AppWindowFrame {
    if (bounds.width <= MOBILE_BREAKPOINT) {
        return {
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height,
        };
    }

    const maxWidth = Math.max(MIN_APP_WINDOW_WIDTH, bounds.width - WINDOW_EDGE_GAP * 2);
    const maxHeight = Math.max(MIN_APP_WINDOW_HEIGHT, bounds.height - WINDOW_EDGE_GAP * 2);
    const width = clampValue(frame.width, MIN_APP_WINDOW_WIDTH, maxWidth);
    const height = clampValue(frame.height, MIN_APP_WINDOW_HEIGHT, maxHeight);
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
        );
    }

    const offsetIndex = options?.index ?? 0;
    const offsetFrame = {
        ...DEFAULT_APP_WINDOW_FRAME,
        x: DEFAULT_APP_WINDOW_FRAME.x + offsetIndex * 28,
        y: DEFAULT_APP_WINDOW_FRAME.y + offsetIndex * 20,
    };

    return clampWindowFrame(offsetFrame, bounds);
}
