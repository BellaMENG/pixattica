import { useCallback, useEffect, useRef, useState } from "react";

interface Point {
    x: number;
    y: number;
}

type DrawingState = "idle" | "drawing" | "done";

const MIN_POINT_DISTANCE = 3;
const MASK_FILL = "rgba(0, 0, 0, 0.45)";
const STROKE_COLOR = "white";
const STROKE_WIDTH_FACTOR = 0.003;
const DASH_FACTOR = 0.008;
const MIN_STROKE_WIDTH = 1;
const MIN_DASH = 3;

interface FreehandCropProps {
    src: string;
    imageStyle?: React.CSSProperties;
    onComplete: (points: Point[]) => void;
    onReset: () => void;
    points: Point[];
}

export default function FreehandCrop({
    src,
    imageStyle,
    onComplete,
    onReset,
    points,
}: FreehandCropProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
    const [drawingState, setDrawingState] = useState<DrawingState>(
        points.length > 0 ? "done" : "idle",
    );
    const drawingPointsRef = useRef<Point[]>([]);
    const [, forceRender] = useState(0);
    const isDrawingRef = useRef(false);

    useEffect(() => {
        if (points.length === 0 && drawingState === "done") {
            setDrawingState("idle");
        }
    }, [points, drawingState]);

    function handleImageLoad() {
        const img = imgRef.current;
        if (!img) return;
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }

    const toSvgPoint = useCallback((clientX: number, clientY: number): Point | null => {
        const svg = svgRef.current;
        if (!svg) return null;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgPt = pt.matrixTransform(ctm.inverse());
        return { x: svgPt.x, y: svgPt.y };
    }, []);

    function isFarEnough(a: Point, b: Point): boolean {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy >= MIN_POINT_DISTANCE * MIN_POINT_DISTANCE;
    }

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (drawingState === "done") return;
            e.preventDefault();
            const svg = svgRef.current;
            if (!svg) return;
            svg.setPointerCapture(e.pointerId);

            const point = toSvgPoint(e.clientX, e.clientY);
            if (!point) return;

            isDrawingRef.current = true;
            drawingPointsRef.current = [point];
            onReset();
            setDrawingState("drawing");
        },
        [drawingState, toSvgPoint, onReset],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!isDrawingRef.current) return;
            e.preventDefault();

            const point = toSvgPoint(e.clientX, e.clientY);
            if (!point) return;

            const currentPoints = drawingPointsRef.current;
            const lastPoint = currentPoints[currentPoints.length - 1];
            if (lastPoint && !isFarEnough(point, lastPoint)) return;

            drawingPointsRef.current = [...currentPoints, point];
            forceRender((c) => c + 1);
        },
        [toSvgPoint],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!isDrawingRef.current) return;
            e.preventDefault();
            isDrawingRef.current = false;

            const svg = svgRef.current;
            if (svg) {
                svg.releasePointerCapture(e.pointerId);
            }

            const collectedPoints = drawingPointsRef.current;
            if (collectedPoints.length >= 3) {
                setDrawingState("done");
                onComplete(collectedPoints);
            } else {
                drawingPointsRef.current = [];
                setDrawingState("idle");
            }
        },
        [onComplete],
    );

    if (!naturalSize) {
        return (
            <img
                ref={imgRef}
                src={src}
                alt="Crop source"
                style={imageStyle}
                onLoad={handleImageLoad}
                draggable={false}
            />
        );
    }

    const viewBox = `0 0 ${naturalSize.width} ${naturalSize.height}`;
    const displayPoints = drawingState === "drawing" ? drawingPointsRef.current : points;
    const polylineStr = displayPoints.map((p) => `${p.x},${p.y}`).join(" ");

    const diagonal = Math.sqrt(naturalSize.width ** 2 + naturalSize.height ** 2);
    const strokeWidth = Math.max(diagonal * STROKE_WIDTH_FACTOR, MIN_STROKE_WIDTH);
    const dashLength = Math.max(diagonal * DASH_FACTOR, MIN_DASH);
    const dashArray = `${dashLength} ${dashLength}`;

    const maskPolygonStr = buildMaskPolygon(naturalSize.width, naturalSize.height, displayPoints);

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <img
                ref={imgRef}
                src={src}
                alt="Crop source"
                style={{ ...imageStyle, display: "block", userSelect: "none" }}
                draggable={false}
            />
            <svg
                ref={svgRef}
                viewBox={viewBox}
                data-testid="freehand-svg"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                    cursor: drawingState === "done" ? "default" : "crosshair",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {displayPoints.length > 0 && drawingState !== "idle" && (
                    <>
                        {drawingState === "done" && (
                            <polygon
                                points={maskPolygonStr}
                                fill={MASK_FILL}
                                fillRule="evenodd"
                                data-testid="freehand-mask"
                            />
                        )}
                        <polyline
                            points={
                                polylineStr +
                                (drawingState === "done" && displayPoints.length > 0
                                    ? ` ${displayPoints[0].x},${displayPoints[0].y}`
                                    : "")
                            }
                            fill="none"
                            stroke={STROKE_COLOR}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            data-testid="freehand-polyline"
                        />
                    </>
                )}
            </svg>
        </div>
    );
}

function buildMaskPolygon(width: number, height: number, selectionPoints: Point[]): string {
    const outer = `0,0 ${width},0 ${width},${height} 0,${height} 0,0`;
    if (selectionPoints.length === 0) return outer;
    const firstPoint = selectionPoints[0];
    const inner = selectionPoints.map((p) => `${p.x},${p.y}`).join(" ");
    return `${outer} ${firstPoint.x},${firstPoint.y} ${inner} ${firstPoint.x},${firstPoint.y} 0,0`;
}
