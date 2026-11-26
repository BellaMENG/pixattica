import { useEffect, useRef, useState } from "react";
import TurntableAnimation from "./TurntableAnimation";
import "./TurntableDock.css";

export default function TurntableDock() {
    const [isOpen, setIsOpen] = useState(false);
    const dockRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsidePointer = (event: PointerEvent) => {
            if (event.target instanceof Node && !dockRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutsidePointer);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsidePointer);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    return (
        <aside
            ref={dockRef}
            className={`turntable-dock${isOpen ? " is-open" : ""}`}
            aria-label="Turntable"
        >
            <button
                type="button"
                className="turntable-dock__handle"
                aria-label={isOpen ? "Hide turntable" : "Show turntable"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span aria-hidden="true">♫</span>
                <span>VINYL</span>
            </button>
            <div className="turntable-dock__panel">
                <TurntableAnimation />
            </div>
        </aside>
    );
}
