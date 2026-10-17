import bagCutout from "./assets/bag/bag-2186-clean.webp";
import frontHandles from "./assets/bag/bag-2186-front-handles.webp";
import bookCover from "./assets/bag/book-cover.jpeg";
import churuCutout from "./assets/bag/churu-cutout.webp";
import laptopCutout from "./assets/bag/laptop-cutout.webp";
import switchCutout from "./assets/bag/switch-2-cutout.webp";
import "./BagLanding.css";
import { useEffect, useState, type MouseEvent } from "react";

const items = [
    { id: "laptop", label: "MacBook Pro", image: laptopCutout },
    { id: "book", label: "Book", image: bookCover },
    { id: "churu", label: "Churu cat treat", image: churuCutout },
    { id: "switch", label: "Nintendo Switch 2", image: switchCutout },
] as const;

const itemCaptions = {
    laptop: "my CV",
    book: "what's I'm reading",
    churu: "my cats!",
    switch: "some games",
} as const;

export default function BagLanding() {
    const [activeCaption, setActiveCaption] = useState("");
    const [bagLoaded, setBagLoaded] = useState(false);
    const [tappedItem, setTappedItem] = useState<string | null>(null);

    useEffect(() => {
        if (!tappedItem) return;

        const dismissOnOutsideClick = (event: PointerEvent) => {
            if (event.target instanceof Element && event.target.closest(".bag-item")) return;
            setTappedItem(null);
            setActiveCaption("");
        };

        document.addEventListener("pointerdown", dismissOnOutsideClick);
        return () => document.removeEventListener("pointerdown", dismissOnOutsideClick);
    }, [tappedItem]);

    const handleItemClick = (id: string, event?: MouseEvent<HTMLAnchorElement>) => {
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (canHover) return;
        if (tappedItem !== id) {
            event?.preventDefault();
            setTappedItem(id);
            setActiveCaption(itemCaptions[id as keyof typeof itemCaptions]);
        }
    };

    return (
        <main className="bag-landing">
            <header className="bag-landing__header">
                <h1 className="bag-landing__title">What&apos;s in my bag</h1>
                <p
                    className={`bag-landing__subtitle${activeCaption ? " is-visible" : ""}`}
                    aria-live="polite"
                >
                    {activeCaption || " "}
                </p>
            </header>
            <div className="bag-scene" role="group" aria-label="What is in Bella's bag">
                <img
                    className="bag-scene__back"
                    src={bagCutout}
                    alt=""
                    draggable={false}
                    fetchPriority="high"
                    onLoad={() => setBagLoaded(true)}
                />
                {bagLoaded &&
                    items.map(({ id, label, image }) =>
                        id === "laptop" || id === "book" ? (
                            <a
                                key={id}
                                className={`bag-item bag-item--${id}${tappedItem === id ? " is-tapped" : ""}`}
                                href={id === "book" ? "/books" : "/cv"}
                                aria-label={
                                    id === "book"
                                        ? "Open Bella Meng's book ratings"
                                        : "Open Bella Meng's CV"
                                }
                                onMouseEnter={() => setActiveCaption(itemCaptions[id])}
                                onMouseLeave={() => setActiveCaption("")}
                                onClick={
                                    id === "laptop"
                                        ? (event) => handleItemClick(id, event)
                                        : undefined
                                }
                                onFocus={() => setActiveCaption(itemCaptions[id])}
                                onBlur={() => setActiveCaption("")}
                            >
                                {id === "book" ? (
                                    <span className="bag-book">
                                        <img src={image} alt="" draggable={false} />
                                    </span>
                                ) : (
                                    <img src={image} alt="" draggable={false} />
                                )}
                            </a>
                        ) : (
                            <button
                                key={id}
                                type="button"
                                className={`bag-item bag-item--${id}${tappedItem === id ? " is-tapped" : ""}`}
                                aria-label={label}
                                onMouseEnter={() => setActiveCaption(itemCaptions[id])}
                                onMouseLeave={() => setActiveCaption("")}
                                onClick={() => handleItemClick(id)}
                                onFocus={() => setActiveCaption(itemCaptions[id])}
                                onBlur={() => setActiveCaption("")}
                            >
                                {id === "switch" ? (
                                    <span className="bag-switch">
                                        <img src={image} alt="" draggable={false} />
                                    </span>
                                ) : (
                                    <img src={image} alt="" draggable={false} />
                                )}
                            </button>
                        ),
                    )}
                {/* The front handles and panel cross the items; the rear wall stays behind them. */}
                <img
                    className="bag-scene__front-strap"
                    src={frontHandles}
                    alt=""
                    draggable={false}
                />
                <svg
                    className="bag-scene__front"
                    viewBox="0 0 1536 1118"
                    aria-hidden="true"
                    focusable="false"
                >
                    <defs>
                        <mask id="bag-front-mask" maskUnits="userSpaceOnUse">
                            <path
                                d="M 0 103 L 32 103 L 96 121 L 160 139 L 224 156 L 288 174 L 352 193 L 416 209 L 480 225 L 544 242 L 608 256 L 672 262 L 736 267 L 800 262 L 864 247 L 928 236 L 992 230 L 1056 218 L 1120 206 L 1184 194 L 1248 179 L 1312 171 L 1376 152 L 1440 143 L 1504 136 L 1536 132 L 1536 1118 L 0 1118 Z"
                                fill="white"
                            />
                        </mask>
                    </defs>
                    <image
                        href={bagCutout}
                        width="1536"
                        height="1118"
                        mask="url(#bag-front-mask)"
                    />
                </svg>
            </div>
        </main>
    );
}
