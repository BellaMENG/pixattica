// ---------------------------------------------------------------------------
// Canvas size presets
// ---------------------------------------------------------------------------

export enum CanvasSizeId {
    SmallLandscape = "small-landscape",
    SmallPortrait = "small-portrait",
    MediumLandscape = "medium-landscape",
    MediumPortrait = "medium-portrait",
    LargeLandscape = "large-landscape",
    LargePortrait = "large-portrait",
}

export interface CanvasSizeOption {
    id: CanvasSizeId;
    label: string;
    width: number;
    height: number;
    tier: string;
}

export const CANVAS_SIZES: CanvasSizeOption[] = [
    {
        id: CanvasSizeId.SmallLandscape,
        label: "Small Landscape",
        width: 800,
        height: 600,
        tier: "Small",
    },
    {
        id: CanvasSizeId.MediumLandscape,
        label: "Medium Landscape",
        width: 1200,
        height: 900,
        tier: "Medium",
    },
    {
        id: CanvasSizeId.LargeLandscape,
        label: "Large Landscape",
        width: 1600,
        height: 1200,
        tier: "Large",
    },
    {
        id: CanvasSizeId.SmallPortrait,
        label: "Small Portrait",
        width: 600,
        height: 800,
        tier: "Small",
    },
    {
        id: CanvasSizeId.MediumPortrait,
        label: "Medium Portrait",
        width: 900,
        height: 1200,
        tier: "Medium",
    },
    {
        id: CanvasSizeId.LargePortrait,
        label: "Large Portrait",
        width: 1200,
        height: 1600,
        tier: "Large",
    },
];

export const CANVAS_FIT_PADDING = 24;
export const CANVAS_TIER_BREAKPOINT_MEDIUM = 1024;
export const CANVAS_TIER_BREAKPOINT_LARGE = 1536;

export function detectCanvasSizeId(): CanvasSizeId {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxDimension = Math.max(vw, vh);
    const isLandscape = vw >= vh;

    if (maxDimension >= CANVAS_TIER_BREAKPOINT_LARGE) {
        return isLandscape ? CanvasSizeId.LargeLandscape : CanvasSizeId.LargePortrait;
    }
    if (maxDimension >= CANVAS_TIER_BREAKPOINT_MEDIUM) {
        return isLandscape ? CanvasSizeId.MediumLandscape : CanvasSizeId.MediumPortrait;
    }
    return isLandscape ? CanvasSizeId.SmallLandscape : CanvasSizeId.SmallPortrait;
}

// ---------------------------------------------------------------------------
// Canvas item placement
// ---------------------------------------------------------------------------

export const MAX_CUTOUT_SIZE_RATIO = 0.7;

// ---------------------------------------------------------------------------
// Canvas selection & transformer appearance
// ---------------------------------------------------------------------------

export const SELECTION_SHADOW_COLOR = "deeppink";
export const SELECTION_SHADOW_BLUR = 12;
export const SELECTION_SHADOW_OPACITY = 0.8;

export const TRANSFORMER_MIN_SIZE = 20;
export const TRANSFORMER_BORDER_STROKE = "deeppink";
export const TRANSFORMER_ANCHOR_STROKE = "deeppink";
export const TRANSFORMER_ANCHOR_FILL = "white";
export const TRANSFORMER_ANCHOR_SIZE = 8;

export const TOOLBAR_VERTICAL_OFFSET = 8;

// ---------------------------------------------------------------------------
// Image cropper
// ---------------------------------------------------------------------------

export const MIN_LASSO_POINTS = 3;
export const CROPPER_IMAGE_MAX_HEIGHT = "60vh";
export const CROPPER_IMAGE_MAX_WIDTH = "70vw";

// ---------------------------------------------------------------------------
// HEIC conversion
// ---------------------------------------------------------------------------

export const HEIC_CONVERSION_TYPE = "image/jpeg";
export const HEIC_CONVERSION_QUALITY = 0.92;

// ---------------------------------------------------------------------------
// Local storage
// ---------------------------------------------------------------------------

export const LOCAL_STORAGE_PREFIX = "pixel-collage:";

// ---------------------------------------------------------------------------
// Favicon animation
// ---------------------------------------------------------------------------

export const FAVICON_SIZE = 32;
export const FAVICON_HEART_COLOR = "#ff4f8a";
export const FAVICON_HIGHLIGHT_COLOR = "#ff87b2";
export const FAVICON_ANIMATION_CYCLE_FRAMES = 300;
