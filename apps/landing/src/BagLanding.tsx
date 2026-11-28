import bagCutout from "./assets/bag/bag-2186-clean.webp";
import frontHandles from "./assets/bag/bag-2186-front-handles.webp";
import bookCover from "./assets/bag/book-cover.jpeg";
import notebookCutout from "./assets/bag/notebook-cutout.png";
import churuCutout from "./assets/bag/churu-cutout.webp";
import laptopCutout from "./assets/bag/laptop-cutout.webp";
import switchCutout from "./assets/bag/switch-2-cutout.webp";
import "./BagLanding.css";
import {
    useEffect,
    useRef,
    useState,
    type MouseEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";

const items = [
    { id: "laptop", label: "MacBook Pro", image: laptopCutout },
    { id: "book", label: "Book", image: bookCover },
    { id: "notebook", label: "Notebook", image: notebookCutout },
    { id: "churu", label: "Churu cat treat", image: churuCutout },
    { id: "switch", label: "Nintendo Switch 2", image: switchCutout },
] as const;

const itemCaptions = {
    laptop: "my CV",
    book: "what's I'm reading",
    notebook: "morning pages",
    churu: "my cats!",
    switch: "some games",
} as const;

type ItemId = (typeof items)[number]["id"];

type ChuruStage = "sealed" | "torn" | "open";

const churuCaptions = { sealed: itemCaptions.churu, torn: "pull the tab!", open: "meet my cats →" };

const churuLabels = {
    sealed: "Tear open the Churu cat treat",
    torn: "Pull off the torn Churu strip",
    open: "Show a random cat photo",
};

const personalPhotos = import.meta.glob<string>("./assets/bag/cats/*.{jpg,jpeg,png,webp,avif}", {
    eager: true,
    import: "default",
    query: "?url",
});
const travelPhotos = import.meta.glob<string>("./assets/cats/**/*.{jpg,jpeg,png,webp,avif}", {
    eager: true,
    import: "default",
    query: "?url",
});
const photoRoster = Object.entries(
    Object.keys(personalPhotos).length ? personalPhotos : travelPhotos,
).map(([path, src]) => ({
    src,
    alt: path
        .split("/")
        .pop()!
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " "),
}));
type CatPhoto = (typeof photoRoster)[number];

export default function BagLanding() {
    const [activeItem, setActiveItem] = useState<ItemId | null>(null);
    const [churuStage, setChuruStage] = useState<ChuruStage>("sealed");
    const [photo, setPhoto] = useState<CatPhoto | null>(null);
    const remainingPhotos = useRef<CatPhoto[]>([]);
    const lastPhoto = useRef<CatPhoto | null>(null);
    const churuButton = useRef<HTMLButtonElement>(null);
    const activeCaption =
        activeItem === "churu" ? churuCaptions[churuStage] : activeItem && itemCaptions[activeItem];
    const [bagLoaded, setBagLoaded] = useState(false);
    const [tappedItem, setTappedItem] = useState<string | null>(null);
    const [swipedItem, setSwipedItem] = useState<ItemId | null>(null);
    const swipeRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        startItem: ItemId | null;
        wasTapped: boolean;
        moved: boolean;
    } | null>(null);
    const suppressClickRef = useRef(false);
    const touchClickRef = useRef<{ id: ItemId; wasTapped: boolean } | null>(null);

    useEffect(() => {
        if (!tappedItem) return;

        const dismissOnOutsideClick = (event: PointerEvent) => {
            if (event.target instanceof Element && event.target.closest(".bag-item")) return;
            setTappedItem(null);
            setActiveItem(null);
        };

        document.addEventListener("pointerdown", dismissOnOutsideClick);
        return () => document.removeEventListener("pointerdown", dismissOnOutsideClick);
    }, [tappedItem]);

    const handleItemClick = (id: ItemId, event?: MouseEvent<HTMLAnchorElement>) => {
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (canHover) return;
        const touchClick = touchClickRef.current;
        touchClickRef.current = null;
        if (touchClick?.id === id) {
            if (!touchClick.wasTapped) event?.preventDefault();
            return;
        }
        if (event?.detail === 0) return;
        if (tappedItem !== id) {
            event?.preventDefault();
            setTappedItem(id);
            setActiveItem(id);
        }
    };

    const activateChuru = () => {
        setActiveItem("churu");
        if (churuStage === "sealed") {
            setChuruStage("torn");
            return;
        }
        if (churuStage === "torn") {
            setChuruStage("open");
            return;
        }

        const deck = remainingPhotos.current;
        if (!deck.length) {
            deck.push(...photoRoster);
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            const end = deck.length - 1;
            if (end > 0 && deck[end] === lastPhoto.current) {
                [deck[0], deck[end]] = [deck[end], deck[0]];
            }
        }
        const next = deck.pop() ?? null;
        lastPhoto.current = next;
        setPhoto(next);
    };

    const dismissPhoto = () => {
        setPhoto(null);
        churuButton.current?.focus({ preventScroll: true });
    };

    const putChuruAway = (event: MouseEvent<HTMLElement>) => {
        if (churuStage === "sealed") return;
        if (
            event.target instanceof Element &&
            event.target.closest(".bag-item--churu, .bag-cat-photo")
        )
            return;

        setChuruStage("sealed");
        setPhoto(null);
        setTappedItem((item) => (item === "churu" ? null : item));
        setActiveItem((item) => (item === "churu" ? null : item));
    };

    const itemAtPoint = (scene: HTMLDivElement, x: number, y: number): ItemId | null => {
        const item = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-bag-item]");
        return item && scene.contains(item) ? (item.dataset.bagItem as ItemId) : null;
    };

    const updateSwipedItem = (scene: HTMLDivElement, x: number, y: number) => {
        const id = itemAtPoint(scene, x, y);
        setSwipedItem(id);
        setActiveItem(id);
    };

    const handleSwipeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        suppressClickRef.current = false;
        if (event.pointerType !== "touch" || !event.isPrimary) return;
        const startItem = itemAtPoint(event.currentTarget, event.clientX, event.clientY);
        touchClickRef.current = null;
        swipeRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startItem,
            wasTapped: tappedItem === startItem,
            moved: false,
        };
        if (tappedItem !== startItem) setTappedItem(null);
        setSwipedItem(startItem);
        setActiveItem(startItem);
    };

    const handleSwipeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const swipe = swipeRef.current;
        if (!swipe || swipe.pointerId !== event.pointerId) return;
        if (Math.hypot(event.clientX - swipe.startX, event.clientY - swipe.startY) > 8) {
            if (!swipe.moved) setTappedItem(null);
            swipe.moved = true;
        }
        updateSwipedItem(event.currentTarget, event.clientX, event.clientY);
    };

    const handleSwipeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        const swipe = swipeRef.current;
        if (!swipe || swipe.pointerId !== event.pointerId) return;
        suppressClickRef.current = swipe.moved;
        if (!swipe.moved && swipe.startItem) {
            touchClickRef.current = { id: swipe.startItem, wasTapped: swipe.wasTapped };
            setTappedItem(swipe.startItem);
            setActiveItem(swipe.startItem);
        } else {
            setTappedItem(null);
            setActiveItem(null);
        }
        swipeRef.current = null;
        setSwipedItem(null);
    };

    const handleSwipeCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (swipeRef.current?.pointerId !== event.pointerId) return;
        swipeRef.current = null;
        touchClickRef.current = null;
        setSwipedItem(null);
        setActiveItem(null);
    };

    const suppressSwipeClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!suppressClickRef.current) return;
        if (event.detail === 0) {
            suppressClickRef.current = false;
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
    };

    return (
        <main
            className="bag-landing"
            onClick={putChuruAway}
            onKeyDown={(event) => {
                if (event.key === "Escape" && photo) dismissPhoto();
            }}
        >
            <header className="bag-landing__header">
                <h1 className="bag-landing__title">What&apos;s in my bag</h1>
                <p
                    className={`bag-landing__subtitle${activeCaption ? " is-visible" : ""}`}
                    aria-live="polite"
                >
                    {activeCaption || " "}
                </p>
            </header>
            <div
                className="bag-scene"
                role="group"
                aria-label="What is in Bella's bag"
                onPointerDown={handleSwipeStart}
                onPointerMove={handleSwipeMove}
                onPointerUp={handleSwipeEnd}
                onPointerCancel={handleSwipeCancel}
                onClickCapture={suppressSwipeClick}
            >
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
                        id === "laptop" || id === "book" || id === "notebook" ? (
                            <a
                                key={id}
                                className={`bag-item bag-item--${id}${tappedItem === id ? " is-tapped" : ""}${swipedItem === id ? " is-swiped" : ""}`}
                                data-bag-item={id}
                                href={
                                    id === "book" ? "/books" : id === "notebook" ? "/blog" : "/cv"
                                }
                                aria-label={
                                    id === "book"
                                        ? "Open Bella Meng's book ratings"
                                        : id === "notebook"
                                          ? "Open Bella Meng's blog"
                                          : "Open Bella Meng's CV"
                                }
                                onMouseEnter={() => setActiveItem(id)}
                                onMouseLeave={() => setActiveItem(null)}
                                onClick={(event) => handleItemClick(id, event)}
                                onFocus={() => setActiveItem(id)}
                                onBlur={() => setActiveItem(null)}
                            >
                                {id === "book" ? (
                                    <span className="bag-book">
                                        <img src={image} alt="" draggable={false} />
                                    </span>
                                ) : id === "notebook" ? (
                                    <span className="bag-notebook">
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
                                className={`bag-item bag-item--${id}${tappedItem === id ? " is-tapped" : ""}${swipedItem === id ? " is-swiped" : ""}`}
                                data-bag-item={id}
                                ref={id === "churu" ? churuButton : undefined}
                                data-churu-stage={id === "churu" ? churuStage : undefined}
                                aria-label={id === "churu" ? churuLabels[churuStage] : label}
                                onMouseEnter={() => setActiveItem(id)}
                                onMouseLeave={() => setActiveItem(null)}
                                onClick={() =>
                                    id === "churu" ? activateChuru() : handleItemClick(id)
                                }
                                onFocus={() => setActiveItem(id)}
                                onBlur={() => setActiveItem(null)}
                            >
                                {id === "switch" ? (
                                    <span className="bag-switch">
                                        <img src={image} alt="" draggable={false} />
                                    </span>
                                ) : (
                                    <span className="churu-packet" aria-hidden="true">
                                        <img
                                            className="churu-body"
                                            src={image}
                                            alt=""
                                            draggable={false}
                                        />
                                        <img
                                            className="churu-strip"
                                            src={image}
                                            alt=""
                                            draggable={false}
                                        />
                                        {churuStage === "open" && <span className="churu-treat" />}
                                    </span>
                                )}
                            </button>
                        ),
                    )}
                {photo && (
                    <div className="bag-cat-photo">
                        <div aria-live="polite" aria-atomic="true">
                            <img key={photo.src} src={photo.src} alt={`Cat photo: ${photo.alt}`} />
                        </div>
                        <button type="button" aria-label="Close cat photo" onClick={dismissPhoto}>
                            ×
                        </button>
                    </div>
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
                                id="bag-front-outline"
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
                    <use href="#bag-front-outline" opacity="0" pointerEvents="fill" />
                </svg>
            </div>
        </main>
    );
}
