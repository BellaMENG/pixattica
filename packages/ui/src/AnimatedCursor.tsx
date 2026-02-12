import { useEffect, useRef, useState } from "react";
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

const FRAME_COUNT = 7;
const FRAME_DURATION = 166;

interface CursorConfig {
    frames: string[];
    hotspot: { x: number; y: number };
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

function preloadImages() {
    for (const cursor of Object.values(CURSORS)) {
        for (const src of cursor.frames) {
            const img = new Image();
            img.src = src;
        }
    }
}

export function AnimatedCursor() {
    const imgRef = useRef<HTMLImageElement>(null);
    const frameRef = useRef(0);
    const cursorTypeRef = useRef<CursorType>("normal");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        preloadImages();
        document.body.classList.add("animated-cursor-ready");

        function updateCursorImage() {
            const el = imgRef.current;
            if (!el) return;
            const type = cursorTypeRef.current;
            el.src = CURSORS[type].frames[frameRef.current];
        }

        function handleMouseMove(e: MouseEvent | PointerEvent) {
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

        document.addEventListener("pointermove", handleMouseMove, true);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("pointermove", handleMouseMove, true);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.body.classList.remove("animated-cursor-ready");
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
