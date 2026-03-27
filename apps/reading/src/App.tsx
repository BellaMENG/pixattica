import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { AnimatedCursor } from "@pixattica/ui";
import { SLIDES, type Slide, type SlideBlock } from "./slides";

const LAST_SLIDE_INDEX = SLIDES.length - 1;

const clampSlideIndex = (value: number) => {
    if (value < 0) {
        return 0;
    }

    if (value > LAST_SLIDE_INDEX) {
        return LAST_SLIDE_INDEX;
    }

    return value;
};

const getSlideNumberLabel = (index: number) => String(index + 1).padStart(2, "0");

const getBulletItemCount = (blocks: SlideBlock[]) =>
    blocks.reduce((count, block) => count + block.items.length, 0);

function SlideContent({ blocks }: { blocks: SlideBlock[] }) {
    return (
        <div className="reading-content-stack">
            {blocks.map((block, index) => {
                const blockKey = `items-${index}`;

                return (
                    <ul className="reading-bullet-list" key={blockKey}>
                        {block.items.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                );
            })}
        </div>
    );
}

function SlideFrame({ slide }: { slide: Slide }) {
    const blocks = slide.blocks ?? [];
    const hasBodyContent = blocks.length > 0;
    const hasSubtitle = Boolean(slide.subtitle);
    const shouldShowTitlePlaceholder = slide.blocks !== undefined && !hasBodyContent;
    const shouldShowClosingPlaceholder = slide.blocks !== undefined && !hasBodyContent;
    const shouldCenterBody =
        slide.align === "center" ||
        (slide.template === "closing" && slide.blocks === undefined) ||
        (hasBodyContent && getBulletItemCount(blocks) <= 4);
    const slideBodyClassName = shouldCenterBody
        ? "reading-slide-body reading-slide-body-centered"
        : "reading-slide-body";

    if (slide.template === "title") {
        return (
            <section className="reading-slide reading-slide-title" aria-live="polite">
                <div className={slideBodyClassName}>
                    <p className="reading-slide-label">{slide.eyebrow}</p>
                    <h1 className="reading-slide-title-text">{slide.title}</h1>
                    {hasSubtitle ? (
                        <p className="reading-slide-subtitle">{slide.subtitle}</p>
                    ) : null}
                    {hasBodyContent ? (
                        <SlideContent blocks={blocks} />
                    ) : shouldShowTitlePlaceholder ? (
                        <div
                            aria-hidden="true"
                            className="reading-placeholder reading-placeholder-title"
                        />
                    ) : null}
                </div>
            </section>
        );
    }

    if (slide.template === "closing") {
        return (
            <section className="reading-slide reading-slide-closing" aria-live="polite">
                <div className={slideBodyClassName}>
                    <p className="reading-slide-label">{slide.eyebrow}</p>
                    <h1 className="reading-slide-title-text">{slide.title}</h1>
                    {hasSubtitle ? (
                        <p className="reading-slide-subtitle">{slide.subtitle}</p>
                    ) : null}
                    {hasBodyContent ? (
                        <SlideContent blocks={blocks} />
                    ) : shouldShowClosingPlaceholder ? (
                        <>
                            <div
                                aria-hidden="true"
                                className="reading-placeholder reading-placeholder-body"
                            />
                            <div
                                aria-hidden="true"
                                className="reading-placeholder reading-placeholder-footer"
                            />
                        </>
                    ) : null}
                </div>
            </section>
        );
    }

    return (
        <section className="reading-slide reading-slide-standard" aria-live="polite">
            <div className={slideBodyClassName}>
                <p className="reading-slide-label">{slide.eyebrow}</p>
                <h1 className="reading-slide-title-text">{slide.title}</h1>
                {hasSubtitle ? <p className="reading-slide-subtitle">{slide.subtitle}</p> : null}
                {hasBodyContent ? (
                    <SlideContent blocks={blocks} />
                ) : (
                    <div
                        aria-hidden="true"
                        className="reading-placeholder reading-placeholder-body"
                    />
                )}
            </div>
        </section>
    );
}

function App() {
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const activeSlide = SLIDES[activeSlideIndex];
    const progress = ((activeSlideIndex + 1) / SLIDES.length) * 100;

    const goToSlide = (nextIndex: number) => {
        const clampedIndex = clampSlideIndex(nextIndex);

        if (clampedIndex === activeSlideIndex) {
            return;
        }

        startTransition(() => {
            setActiveSlideIndex(clampedIndex);
        });
    };

    const handleWindowKeyDown = useEffectEvent((event: KeyboardEvent) => {
        const target = event.target;
        if (target instanceof HTMLElement) {
            const tagName = target.tagName;
            const isInteractiveElement =
                target.isContentEditable ||
                tagName === "BUTTON" ||
                tagName === "INPUT" ||
                tagName === "SELECT" ||
                tagName === "TEXTAREA" ||
                target.closest("button") !== null;

            if (isInteractiveElement) {
                return;
            }
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            goToSlide(activeSlideIndex + 1);
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToSlide(activeSlideIndex - 1);
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            goToSlide(0);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            goToSlide(LAST_SLIDE_INDEX);
        }
    });

    useEffect(() => {
        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, []);

    return (
        <main className="reading-app">
            <div className="reading-shell">
                <header className="reading-header">
                    <p className="reading-route">/all-about-reading</p>
                    <p className="reading-count">
                        {getSlideNumberLabel(activeSlideIndex)} /{" "}
                        {getSlideNumberLabel(LAST_SLIDE_INDEX)}
                    </p>
                </header>

                <div aria-hidden="true" className="reading-progress">
                    <span style={{ width: `${progress}%` }} />
                </div>

                <div className="reading-stage">
                    <SlideFrame key={activeSlide.id} slide={activeSlide} />
                </div>

                <footer className="reading-footer">
                    <button
                        className="reading-control"
                        onClick={() => goToSlide(activeSlideIndex - 1)}
                        type="button"
                    >
                        Previous
                    </button>
                    <button
                        className="reading-control"
                        onClick={() => goToSlide(activeSlideIndex + 1)}
                        type="button"
                    >
                        Next
                    </button>
                </footer>
            </div>
            <AnimatedCursor />
        </main>
    );
}

export default App;
