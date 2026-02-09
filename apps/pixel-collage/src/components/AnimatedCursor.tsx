import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 7;
const FRAME_DURATION = 166;

interface CursorConfig {
    frames: string[];
    hotspot: { x: number; y: number };
}

const CURSORS: Record<"normal" | "link", CursorConfig> = {
    normal: {
        frames: Array.from({ length: FRAME_COUNT }, (_, i) => `/cursors/normal-${i}.png`),
        hotspot: { x: 1, y: 1 },
    },
    link: {
        frames: Array.from({ length: FRAME_COUNT }, (_, i) => `/cursors/link-${i}.png`),
        hotspot: { x: 7, y: 2 },
    },
};

type CursorType = keyof typeof CURSORS;

const INTERACTIVE_SELECTOR =
    'button, a, [role="button"], input[type="file"], label[for], select, .cursor-pointer';

function preloadImages() {
    for (const cursor of Object.values(CURSORS)) {
        for (const src of cursor.frames) {
            const img = new Image();
            img.src = src;
        }
    }
}

export default function AnimatedCursor() {
    const imgRef = useRef<HTMLImageElement>(null);
    const frameRef = useRef(0);
    const cursorTypeRef = useRef<CursorType>("normal");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        preloadImages();

        function updateCursorImage() {
            const el = imgRef.current;
            if (!el) return;
            const type = cursorTypeRef.current;
            el.src = CURSORS[type].frames[frameRef.current];
        }

        function handleMouseMove(e: MouseEvent) {
            const el = imgRef.current;
            if (!el) return;

            const target = e.target as Element | null;
            const isInteractive = target?.closest?.(INTERACTIVE_SELECTOR) != null;
            const newType: CursorType = isInteractive ? "link" : "normal";

            if (newType !== cursorTypeRef.current) {
                cursorTypeRef.current = newType;
                updateCursorImage();
            }

            const { x, y } = CURSORS[newType].hotspot;
            el.style.transform = `translate(${e.clientX - x}px, ${e.clientY - y}px)`;
        }

        function handleMouseEnter() {
            setVisible(true);
        }

        function handleMouseLeave() {
            setVisible(false);
        }

        const intervalId = setInterval(() => {
            frameRef.current = (frameRef.current + 1) % FRAME_COUNT;
            updateCursorImage();
        }, FRAME_DURATION);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <img
            ref={imgRef}
            src={CURSORS.normal.frames[0]}
            alt=""
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: 32,
                height: 32,
                pointerEvents: "none",
                zIndex: 9999,
                display: visible ? "block" : "none",
                imageRendering: "pixelated",
            }}
        />
    );
}
