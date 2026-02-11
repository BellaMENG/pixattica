import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi, beforeAll, afterAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import FreehandCrop from "./FreehandCrop";

// jsdom does not implement PointerEvent; testing-library falls back to Event
// which drops clientX/clientY. Polyfill PointerEvent as a MouseEvent subclass.
if (typeof globalThis.PointerEvent === "undefined") {
    (globalThis as Record<string, unknown>).PointerEvent = class PointerEvent extends MouseEvent {
        readonly pointerId: number;
        readonly pointerType: string;
        constructor(type: string, init: PointerEventInit & MouseEventInit = {}) {
            super(type, init);
            this.pointerId = init.pointerId ?? 0;
            this.pointerType = init.pointerType ?? "";
        }
    };
}

const originalCreateSVGPoint = SVGSVGElement.prototype.createSVGPoint;
const originalGetScreenCTM = SVGSVGElement.prototype.getScreenCTM;
const originalSetPointerCapture = Element.prototype.setPointerCapture;
const originalReleasePointerCapture = Element.prototype.releasePointerCapture;

function createProps(overrides: Partial<React.ComponentProps<typeof FreehandCrop>> = {}) {
    return {
        src: "test-image.png",
        points: [] as { x: number; y: number }[],
        onComplete: vi.fn(),
        onReset: vi.fn(),
        ...overrides,
    };
}

function simulateImageLoad(naturalWidth = 800, naturalHeight = 600) {
    const img = screen.getByAltText("Crop source") as HTMLImageElement;
    Object.defineProperty(img, "naturalWidth", { value: naturalWidth, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: naturalHeight, configurable: true });
    fireEvent.load(img);
}

function getSvg(): SVGSVGElement {
    return screen.getByTestId("freehand-svg") as unknown as SVGSVGElement;
}

function pointerDown(target: Element, clientX: number, clientY: number) {
    fireEvent.pointerDown(target, { clientX, clientY, pointerId: 1 });
}

function pointerMove(target: Element, clientX: number, clientY: number) {
    fireEvent.pointerMove(target, { clientX, clientY, pointerId: 1 });
}

function pointerUp(target: Element, clientX: number, clientY: number) {
    fireEvent.pointerUp(target, { clientX, clientY, pointerId: 1 });
}

describe("FreehandCrop", () => {
    beforeAll(() => {
        /* eslint-disable no-extend-native -- jsdom lacks these SVG/pointer APIs; must polyfill on prototype */
        SVGSVGElement.prototype.createSVGPoint = function () {
            const point = {
                x: 0,
                y: 0,
                matrixTransform(_matrix: DOMMatrix) {
                    return { x: point.x, y: point.y } as DOMPoint;
                },
            } as unknown as SVGPoint;
            return point;
        };

        SVGSVGElement.prototype.getScreenCTM = function () {
            return {
                a: 1,
                d: 1,
                inverse() {
                    return { a: 1, d: 1 } as unknown as DOMMatrix;
                },
            } as unknown as DOMMatrix;
        };

        Element.prototype.setPointerCapture = vi.fn();
        Element.prototype.releasePointerCapture = vi.fn();
        /* eslint-enable no-extend-native */
    });

    afterAll(() => {
        /* eslint-disable no-extend-native -- restore original prototypes */
        SVGSVGElement.prototype.createSVGPoint = originalCreateSVGPoint;
        SVGSVGElement.prototype.getScreenCTM = originalGetScreenCTM;
        Element.prototype.setPointerCapture = originalSetPointerCapture;
        Element.prototype.releasePointerCapture = originalReleasePointerCapture;
        /* eslint-enable no-extend-native */
    });

    afterEach(() => {
        cleanup();
    });

    describe("rendering", () => {
        it("renders the image with the provided src", () => {
            render(<FreehandCrop {...createProps()} />);

            const img = screen.getByAltText("Crop source");
            expect(img).toHaveAttribute("src", "test-image.png");
        });

        it("applies imageStyle to the img element", () => {
            render(
                <FreehandCrop
                    {...createProps({ imageStyle: { maxHeight: "60vh", maxWidth: "70vw" } })}
                />,
            );

            const img = screen.getByAltText("Crop source") as HTMLImageElement;
            expect(img.style.maxHeight).toBe("60vh");
            expect(img.style.maxWidth).toBe("70vw");
        });

        it("shows the SVG overlay after the image loads", () => {
            render(<FreehandCrop {...createProps()} />);

            expect(screen.queryByTestId("freehand-svg")).not.toBeInTheDocument();

            simulateImageLoad();

            expect(screen.getByTestId("freehand-svg")).toBeInTheDocument();
        });

        it("sets SVG viewBox to match image natural dimensions", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad(1024, 768);

            expect(getSvg().getAttribute("viewBox")).toBe("0 0 1024 768");
        });

        it("sets touch-action none on SVG to prevent scrolling", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            expect(getSvg().style.touchAction).toBe("none");
        });
    });

    describe("drawing flow", () => {
        it("does not show polyline before drawing starts", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            expect(screen.queryByTestId("freehand-polyline")).not.toBeInTheDocument();
        });

        it("shows polyline during drawing", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            const svg = getSvg();
            pointerDown(svg, 100, 100);
            pointerMove(svg, 110, 110);

            expect(screen.getByTestId("freehand-polyline")).toBeInTheDocument();
        });

        it("captures the pointer on pointerdown", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            pointerDown(getSvg(), 100, 100);

            expect(Element.prototype.setPointerCapture).toHaveBeenCalled();
        });

        it("releases the pointer on pointerup", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            const svg = getSvg();
            pointerDown(svg, 100, 100);
            pointerMove(svg, 200, 100);
            pointerMove(svg, 200, 200);
            pointerMove(svg, 100, 200);
            pointerUp(svg, 100, 200);

            expect(Element.prototype.releasePointerCapture).toHaveBeenCalled();
        });
    });

    describe("completion", () => {
        it("calls onComplete with collected points when enough points are drawn", () => {
            const onComplete = vi.fn();
            render(<FreehandCrop {...createProps({ onComplete })} />);
            simulateImageLoad();

            const svg = getSvg();
            pointerDown(svg, 100, 100);
            pointerMove(svg, 200, 100);
            pointerMove(svg, 200, 200);
            pointerMove(svg, 100, 200);
            pointerUp(svg, 100, 200);

            expect(onComplete).toHaveBeenCalledTimes(1);
            const calledPoints = onComplete.mock.calls[0][0];
            expect(calledPoints.length).toBeGreaterThanOrEqual(3);
        });

        it("does not call onComplete when fewer than 3 points are drawn", () => {
            const onComplete = vi.fn();
            render(<FreehandCrop {...createProps({ onComplete })} />);
            simulateImageLoad();

            const svg = getSvg();
            pointerDown(svg, 10, 10);
            pointerUp(svg, 10, 10);

            expect(onComplete).not.toHaveBeenCalled();
        });

        it("returns to idle state when fewer than 3 points are drawn", () => {
            render(<FreehandCrop {...createProps()} />);
            simulateImageLoad();

            const svg = getSvg();
            pointerDown(svg, 10, 10);
            pointerUp(svg, 10, 10);

            expect(screen.queryByTestId("freehand-polyline")).not.toBeInTheDocument();
        });

        it("calls onReset when starting a new drawing", () => {
            const onReset = vi.fn();
            render(<FreehandCrop {...createProps({ onReset })} />);
            simulateImageLoad();

            pointerDown(getSvg(), 10, 10);

            expect(onReset).toHaveBeenCalledTimes(1);
        });
    });

    describe("done state with provided points", () => {
        const selectionPoints = [
            { x: 10, y: 10 },
            { x: 100, y: 10 },
            { x: 100, y: 100 },
        ];

        it("shows the selection mask when points are provided", () => {
            render(<FreehandCrop {...createProps({ points: selectionPoints })} />);
            simulateImageLoad();

            expect(screen.getByTestId("freehand-mask")).toBeInTheDocument();
        });

        it("shows the polyline with closing segment when in done state", () => {
            render(<FreehandCrop {...createProps({ points: selectionPoints })} />);
            simulateImageLoad();

            const pointsAttr = screen.getByTestId("freehand-polyline").getAttribute("points") ?? "";
            expect(pointsAttr).toContain("10,10");
            expect(pointsAttr).toContain("100,10");
            expect(pointsAttr).toContain("100,100");
        });

        it("uses evenodd fill rule on the mask polygon", () => {
            render(<FreehandCrop {...createProps({ points: selectionPoints })} />);
            simulateImageLoad();

            expect(screen.getByTestId("freehand-mask").getAttribute("fill-rule")).toBe("evenodd");
        });

        it("does not start a new drawing when already in done state", () => {
            const onReset = vi.fn();
            render(<FreehandCrop {...createProps({ points: selectionPoints, onReset })} />);
            simulateImageLoad();

            pointerDown(getSvg(), 50, 50);

            expect(onReset).not.toHaveBeenCalled();
        });
    });

    describe("reset behavior", () => {
        it("returns to idle state when points are cleared externally", () => {
            const points = [
                { x: 10, y: 10 },
                { x: 100, y: 10 },
                { x: 100, y: 100 },
            ];
            const props = createProps({ points });
            const { rerender } = render(<FreehandCrop {...props} />);
            simulateImageLoad();

            expect(screen.getByTestId("freehand-mask")).toBeInTheDocument();

            rerender(<FreehandCrop {...props} points={[]} />);

            expect(screen.queryByTestId("freehand-mask")).not.toBeInTheDocument();
            expect(screen.queryByTestId("freehand-polyline")).not.toBeInTheDocument();
        });
    });

    describe("polyline styling", () => {
        it("renders the polyline with white dashed stroke", () => {
            const points = [
                { x: 10, y: 10 },
                { x: 100, y: 10 },
                { x: 100, y: 100 },
            ];
            render(<FreehandCrop {...createProps({ points })} />);
            simulateImageLoad();

            const polyline = screen.getByTestId("freehand-polyline");
            expect(polyline.getAttribute("stroke")).toBe("white");
            expect(polyline.getAttribute("fill")).toBe("none");
            expect(polyline.getAttribute("stroke-dasharray")).toBeTruthy();
        });
    });
});
