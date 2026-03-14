import { useEffect, useRef } from "react";
import link0 from "./assets/cursors/link-0.png";
import link1 from "./assets/cursors/link-1.png";
import link2 from "./assets/cursors/link-2.png";
import link3 from "./assets/cursors/link-3.png";
import link4 from "./assets/cursors/link-4.png";
import link5 from "./assets/cursors/link-5.png";
import link6 from "./assets/cursors/link-6.png";
import normal0 from "./assets/cursors/normal-0.png";
import normal1 from "./assets/cursors/normal-1.png";
import normal2 from "./assets/cursors/normal-2.png";
import normal3 from "./assets/cursors/normal-3.png";
import normal4 from "./assets/cursors/normal-4.png";
import normal5 from "./assets/cursors/normal-5.png";
import normal6 from "./assets/cursors/normal-6.png";
import {
    advanceCursorFrame,
    shouldEnableAnimatedCursor,
    updateCursorPerformanceState,
} from "./animatedCursorUtils";

const FRAME_COUNT = 7;
const FRAME_DURATION = 166;
const HIDDEN_TRANSLATE = "translate3d(-9999px, -9999px, 0)";
const CURSOR_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";
const CURSOR_DISABLED_SESSION_KEY = "pixattica:animated-cursor-disabled";
const SLOW_FRAME_THRESHOLD_MS = 34;
const SLOW_FRAME_LIMIT = 8;

interface CursorConfig {
    frames: string[];
    hotspot: { x: number; y: number };
}

interface CursorSpriteSheet {
    canvas: HTMLCanvasElement;
    frameHeight: number;
    frameWidth: number;
}

const CURSORS: Record<"normal" | "link", CursorConfig> = {
    normal: {
        frames: [normal0, normal1, normal2, normal3, normal4, normal5, normal6],
        hotspot: { x: 1, y: 1 },
    },
    link: {
        frames: [link0, link1, link2, link3, link4, link5, link6],
        hotspot: { x: 7, y: 2 },
    },
};

type CursorType = keyof typeof CURSORS;

const INTERACTIVE_SELECTOR =
    'button, a, [role="button"], input[type="file"], label[for], select, .cursor-pointer';

let spriteSheetPromise: Promise<Record<CursorType, CursorSpriteSheet>> | null = null;

function isLowPowerCursorModeEnabled() {
    const navigatorWithConnection = navigator as Navigator & {
        connection?: { saveData?: boolean };
    };
    const saveDataEnabled = navigatorWithConnection.connection?.saveData === true;

    try {
        return (
            saveDataEnabled || window.sessionStorage.getItem(CURSOR_DISABLED_SESSION_KEY) === "1"
        );
    } catch {
        return saveDataEnabled;
    }
}

function disableAnimatedCursorForSession() {
    try {
        window.sessionStorage.setItem(CURSOR_DISABLED_SESSION_KEY, "1");
    } catch {
        // Ignore storage failures and keep the in-memory fallback.
    }
}

function canUseAnimatedCursor() {
    return shouldEnableAnimatedCursor({
        hasFinePointer: window.matchMedia(CURSOR_MEDIA_QUERY).matches,
        hasHover: window.matchMedia("(hover: hover)").matches,
        lowPowerMode: isLowPowerCursorModeEnabled(),
        prefersReducedMotion: window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches,
    });
}

function preloadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to preload cursor frame: ${src}`));
        img.src = src;
        void img
            .decode()
            .then(() => resolve(img))
            .catch(() => {
                if (img.complete) {
                    resolve(img);
                }
            });
    });
}

async function buildCursorSpriteSheets() {
    if (!spriteSheetPromise) {
        spriteSheetPromise = (async () => {
            const spriteSheets = {} as Record<CursorType, CursorSpriteSheet>;

            for (const [cursorType, config] of Object.entries(CURSORS) as Array<
                [CursorType, CursorConfig]
            >) {
                const images = await Promise.all(config.frames.map((src) => preloadImage(src)));
                const frameWidth = images[0]?.naturalWidth ?? 32;
                const frameHeight = images[0]?.naturalHeight ?? 32;
                const sheetCanvas = document.createElement("canvas");

                sheetCanvas.width = frameWidth * images.length;
                sheetCanvas.height = frameHeight;

                const context = sheetCanvas.getContext("2d");
                if (!context) {
                    throw new Error("Failed to create cursor sprite sheet context");
                }

                images.forEach((image, index) => {
                    context.drawImage(image, index * frameWidth, 0, frameWidth, frameHeight);
                });

                spriteSheets[cursorType] = {
                    canvas: sheetCanvas,
                    frameHeight,
                    frameWidth,
                };
            }

            return spriteSheets;
        })();
    }

    return spriteSheetPromise;
}

export function AnimatedCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);
    const cursorTypeRef = useRef<CursorType>("normal");
    const isVisibleRef = useRef(false);
    const isReadyRef = useRef(false);
    const isDisabledRef = useRef(false);
    const positionRef = useRef({ x: -9999, y: -9999 });
    const needsPositionRenderRef = useRef(false);
    const needsFrameRenderRef = useRef(true);
    const slowFrameCountRef = useRef(0);
    const remainingFrameTimeRef = useRef(0);
    const spriteSheetsRef = useRef<Record<CursorType, CursorSpriteSheet> | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !canUseAnimatedCursor()) {
            return;
        }

        const el = canvasRef.current;
        if (!el) {
            return;
        }
        const cursorEl: HTMLCanvasElement = el;
        const context = cursorEl.getContext("2d");
        if (!context) {
            return;
        }
        const cursorContext: CanvasRenderingContext2D = context;

        let rafId = 0;
        let isMounted = true;
        let lastRenderTimestamp = 0;

        function paintCurrentFrame() {
            if (!needsFrameRenderRef.current) {
                return;
            }

            const spriteSheet = spriteSheetsRef.current?.[cursorTypeRef.current];
            if (!spriteSheet) {
                return;
            }

            const type = cursorTypeRef.current;
            cursorEl.width = spriteSheet.frameWidth;
            cursorEl.height = spriteSheet.frameHeight;
            cursorContext.clearRect(0, 0, spriteSheet.frameWidth, spriteSheet.frameHeight);
            cursorContext.drawImage(
                spriteSheet.canvas,
                frameRef.current * spriteSheet.frameWidth,
                0,
                spriteSheet.frameWidth,
                spriteSheet.frameHeight,
                0,
                0,
                spriteSheet.frameWidth,
                spriteSheet.frameHeight,
            );
            cursorEl.setAttribute("data-cursor-type", type);
            needsFrameRenderRef.current = false;
        }

        function syncVisibility(nextVisible: boolean) {
            if (isVisibleRef.current === nextVisible) {
                return;
            }

            isVisibleRef.current = nextVisible;
            document.body.classList.toggle("animated-cursor-ready", nextVisible);
            cursorEl.style.opacity = nextVisible ? "1" : "0";

            if (!nextVisible) {
                cursorEl.style.transform = HIDDEN_TRANSLATE;
            }
        }

        function stopAnimationLoop() {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
            }
        }

        function startAnimationLoop() {
            if (rafId) {
                return;
            }

            lastRenderTimestamp = performance.now();
            rafId = window.requestAnimationFrame(render);
        }

        function render(timestamp: number) {
            if (!isMounted || !isVisibleRef.current) {
                stopAnimationLoop();
                return;
            }

            const frameDeltaMs = timestamp - lastRenderTimestamp;
            lastRenderTimestamp = timestamp;

            const performanceState = updateCursorPerformanceState({
                frameDeltaMs,
                slowFrameCount: slowFrameCountRef.current,
                slowFrameLimit: SLOW_FRAME_LIMIT,
                slowFrameThresholdMs: SLOW_FRAME_THRESHOLD_MS,
            });
            slowFrameCountRef.current = performanceState.slowFrameCount;

            if (performanceState.shouldFallbackToNativeCursor) {
                isDisabledRef.current = true;
                disableAnimatedCursorForSession();
                hideCursor();
                return;
            }

            const nextFrameState = advanceCursorFrame({
                currentFrame: frameRef.current,
                elapsedMs: remainingFrameTimeRef.current + frameDeltaMs,
                frameCount: FRAME_COUNT,
                frameDuration: FRAME_DURATION,
            });
            frameRef.current = nextFrameState.currentFrame;
            remainingFrameTimeRef.current = nextFrameState.remainingMs;

            if (nextFrameState.frameAdvance > 0) {
                needsFrameRenderRef.current = true;
            }

            if (needsPositionRenderRef.current) {
                const { x, y } = positionRef.current;
                const hotspot = CURSORS[cursorTypeRef.current].hotspot;
                cursorEl.style.transform = `translate3d(${x - hotspot.x}px, ${y - hotspot.y}px, 0)`;
                needsPositionRenderRef.current = false;
            }

            paintCurrentFrame();
            rafId = window.requestAnimationFrame(render);
        }

        function showCursor() {
            if (!isReadyRef.current || isDisabledRef.current) {
                return;
            }

            syncVisibility(true);
            startAnimationLoop();
        }

        function hideCursor() {
            syncVisibility(false);
            stopAnimationLoop();
        }

        function handlePointerMove(e: PointerEvent) {
            if (
                !isReadyRef.current ||
                isDisabledRef.current ||
                (e.pointerType && e.pointerType !== "mouse")
            ) {
                return;
            }

            const target = e.target as Element | null;
            const isInteractive = target?.closest?.(INTERACTIVE_SELECTOR) != null;
            const newType: CursorType = isInteractive ? "link" : "normal";

            if (newType !== cursorTypeRef.current) {
                cursorTypeRef.current = newType;
                needsFrameRenderRef.current = true;
            }

            positionRef.current = { x: e.clientX, y: e.clientY };
            needsPositionRenderRef.current = true;
            showCursor();
        }

        function handleWindowMouseOut(e: MouseEvent) {
            if (e.relatedTarget == null) {
                hideCursor();
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState !== "visible") {
                hideCursor();
            }
        }

        void buildCursorSpriteSheets()
            .then((spriteSheets) => {
                if (!isMounted) {
                    return;
                }

                spriteSheetsRef.current = spriteSheets;
                paintCurrentFrame();
                isReadyRef.current = true;
                needsFrameRenderRef.current = true;
            })
            .catch(() => {
                isDisabledRef.current = true;
            });

        window.addEventListener("pointermove", handlePointerMove, { capture: true, passive: true });
        window.addEventListener("mouseout", handleWindowMouseOut);
        window.addEventListener("blur", hideCursor);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isMounted = false;
            hideCursor();
            window.removeEventListener("pointermove", handlePointerMove, true);
            window.removeEventListener("mouseout", handleWindowMouseOut);
            window.removeEventListener("blur", hideCursor);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: 32,
                height: 32,
                pointerEvents: "none",
                zIndex: 9999,
                opacity: 0,
                transform: HIDDEN_TRANSLATE,
                imageRendering: "pixelated",
                willChange: "transform, opacity",
            }}
        />
    );
}
