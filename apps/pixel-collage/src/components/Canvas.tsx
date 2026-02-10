import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from "react-konva";
import useImage from "use-image";
import type { CanvasItem, CanvasImageItem, CanvasTextItem } from "../App";
import {
    SELECTION_SHADOW_COLOR,
    SELECTION_SHADOW_BLUR,
    SELECTION_SHADOW_OPACITY,
    TRANSFORMER_MIN_SIZE,
    TRANSFORMER_BORDER_STROKE,
    TRANSFORMER_ANCHOR_STROKE,
    TRANSFORMER_ANCHOR_FILL,
    TRANSFORMER_ANCHOR_SIZE,
    TOOLBAR_VERTICAL_OFFSET,
    CANVAS_FIT_PADDING,
    CANVAS_ASPECT_RATIO,
    TEXT_FONT_FAMILY,
    TEXT_FONT_SIZE,
    TEXT_FILL,
} from "../config";
import type Konva from "konva";

interface CanvasProps {
    items: CanvasItem[];
    selectedItemId: string | null;
    onSelect: (id: string | null) => void;
    onDelete: (id: string) => void;
    onBringToFront: (id: string) => void;
    onSendToBack: (id: string) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
    onTransformEnd: (
        id: string,
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotation: number,
    ) => void;
    onResize: (size: { width: number; height: number }) => void;
    backgroundStyle: string;
    stageRef?: React.RefObject<Konva.Stage | null>;
}

function ToolbarButton({
    label,
    onClick,
    icon,
}: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="flex cursor-pointer items-center gap-1 rounded-md bg-pink-500 px-2 py-1 text-xs font-medium text-white shadow-md transition-colors hover:bg-pink-600"
        >
            {icon}
            {label}
        </button>
    );
}

function BringToFrontIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="8" y="2" width="14" height="14" rx="2" />
            <rect x="2" y="8" width="14" height="14" rx="2" opacity="0.4" />
        </svg>
    );
}

function SendToBackIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="2" y="2" width="14" height="14" rx="2" opacity="0.4" />
            <rect x="8" y="8" width="14" height="14" rx="2" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

function CanvasImage({
    item,
    isSelected,
    onSelect,
    onDragEnd,
    onDragMove,
    onTransformEnd,
}: {
    item: CanvasImageItem;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onTransformEnd: (
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotation: number,
    ) => void;
}) {
    const [image] = useImage(item.src);
    const imageRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (!imageRef.current) return;
        if (isSelected) {
            imageRef.current.shadowColor(SELECTION_SHADOW_COLOR);
            imageRef.current.shadowBlur(SELECTION_SHADOW_BLUR);
            imageRef.current.shadowOpacity(SELECTION_SHADOW_OPACITY);
            imageRef.current.shadowOffset({ x: 0, y: 0 });
        } else {
            imageRef.current.shadowBlur(0);
            imageRef.current.shadowOpacity(0);
        }
        imageRef.current.getLayer()?.batchDraw();
    }, [isSelected]);

    useEffect(() => {
        if (isSelected && transformerRef.current && imageRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <KonvaImage
                ref={imageRef}
                image={image}
                x={item.x}
                y={item.y}
                scaleX={item.scaleX}
                scaleY={item.scaleY}
                rotation={item.rotation}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onDragEnd(e.target.x(), e.target.y());
                }}
                onDragMove={(e) => {
                    onDragMove(e.target.x(), e.target.y());
                }}
                onTransformEnd={() => {
                    const node = imageRef.current;
                    if (!node) return;
                    onTransformEnd(
                        node.x(),
                        node.y(),
                        node.scaleX(),
                        node.scaleY(),
                        node.rotation(),
                    );
                }}
            />
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    keepRatio={true}
                    boundBoxFunc={(_oldBox, newBox) => {
                        if (
                            newBox.width < TRANSFORMER_MIN_SIZE ||
                            newBox.height < TRANSFORMER_MIN_SIZE
                        ) {
                            return _oldBox;
                        }
                        return newBox;
                    }}
                    borderStroke={TRANSFORMER_BORDER_STROKE}
                    anchorStroke={TRANSFORMER_ANCHOR_STROKE}
                    anchorFill={TRANSFORMER_ANCHOR_FILL}
                    anchorSize={TRANSFORMER_ANCHOR_SIZE}
                />
            )}
        </>
    );
}

function CanvasText({
    item,
    isSelected,
    onSelect,
    onDragEnd,
    onDragMove,
    onTransformEnd,
}: {
    item: CanvasTextItem;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onTransformEnd: (
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotation: number,
    ) => void;
}) {
    const textRef = useRef<Konva.Text>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (!textRef.current) return;
        if (isSelected) {
            textRef.current.shadowColor(SELECTION_SHADOW_COLOR);
            textRef.current.shadowBlur(SELECTION_SHADOW_BLUR);
            textRef.current.shadowOpacity(SELECTION_SHADOW_OPACITY);
            textRef.current.shadowOffset({ x: 0, y: 0 });
        } else {
            textRef.current.shadowBlur(0);
            textRef.current.shadowOpacity(0);
        }
        textRef.current.getLayer()?.batchDraw();
    }, [isSelected]);

    useEffect(() => {
        if (isSelected && transformerRef.current && textRef.current) {
            transformerRef.current.nodes([textRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Text
                ref={textRef}
                text={item.text}
                fontFamily={TEXT_FONT_FAMILY}
                fontSize={TEXT_FONT_SIZE}
                fill={TEXT_FILL}
                x={item.x}
                y={item.y}
                scaleX={item.scaleX}
                scaleY={item.scaleY}
                rotation={item.rotation}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onDragEnd(e.target.x(), e.target.y());
                }}
                onDragMove={(e) => {
                    onDragMove(e.target.x(), e.target.y());
                }}
                onTransformEnd={() => {
                    const node = textRef.current;
                    if (!node) return;
                    onTransformEnd(
                        node.x(),
                        node.y(),
                        node.scaleX(),
                        node.scaleY(),
                        node.rotation(),
                    );
                }}
            />
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    keepRatio={true}
                    boundBoxFunc={(_oldBox, newBox) => {
                        if (
                            newBox.width < TRANSFORMER_MIN_SIZE ||
                            newBox.height < TRANSFORMER_MIN_SIZE
                        ) {
                            return _oldBox;
                        }
                        return newBox;
                    }}
                    borderStroke={TRANSFORMER_BORDER_STROKE}
                    anchorStroke={TRANSFORMER_ANCHOR_STROKE}
                    anchorFill={TRANSFORMER_ANCHOR_FILL}
                    anchorSize={TRANSFORMER_ANCHOR_SIZE}
                />
            )}
        </>
    );
}

function computeInitialCanvasSize(
    containerWidth: number,
    containerHeight: number,
): { width: number; height: number } {
    const availW = containerWidth - CANVAS_FIT_PADDING * 2;
    const availH = containerHeight - CANVAS_FIT_PADDING * 2;
    if (availW <= 0 || availH <= 0) return { width: 0, height: 0 };

    const isLandscape = containerWidth >= containerHeight;
    const ratio = isLandscape ? CANVAS_ASPECT_RATIO : 1 / CANVAS_ASPECT_RATIO;

    let canvasW = Math.min(availW, availH * ratio);
    let canvasH = canvasW / ratio;
    if (canvasH > availH) {
        canvasH = availH;
        canvasW = canvasH * ratio;
    }

    return { width: Math.round(canvasW), height: Math.round(canvasH) };
}

function computeFitScale(
    containerWidth: number,
    containerHeight: number,
    canvasWidth: number,
    canvasHeight: number,
): number {
    if (containerWidth <= 0 || containerHeight <= 0) return 1;
    return Math.min(
        (containerWidth - CANVAS_FIT_PADDING * 2) / canvasWidth,
        (containerHeight - CANVAS_FIT_PADDING * 2) / canvasHeight,
        1,
    );
}

export default function Canvas({
    items,
    selectedItemId,
    onSelect,
    onDelete,
    onBringToFront,
    onSendToBack,
    onDragEnd,
    onTransformEnd,
    onResize,
    backgroundStyle,
    stageRef,
}: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasSizeRef = useRef<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

    const selectedItem = selectedItemId
        ? (items.find((i) => i.id === selectedItemId) ?? null)
        : null;

    const buttonPos = selectedItem ? (dragPos ?? { x: selectedItem.x, y: selectedItem.y }) : null;

    const canvasWidth = canvasSizeRef.current?.width ?? 0;
    const canvasHeight = canvasSizeRef.current?.height ?? 0;

    const fitScale = computeFitScale(
        containerSize.width,
        containerSize.height,
        canvasWidth,
        canvasHeight,
    );
    const visualWidth = canvasWidth * fitScale;
    const visualHeight = canvasHeight * fitScale;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                if (!canvasSizeRef.current) {
                    const size = computeInitialCanvasSize(width, height);
                    canvasSizeRef.current = size;
                    onResize(size);
                }
                setContainerSize({ width, height });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [onResize]);

    useEffect(() => {
        setDragPos(null);
    }, [selectedItemId]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!selectedItemId) return;
            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                onDelete(selectedItemId);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedItemId, onDelete]);

    function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
        if (e.target === e.target.getStage()) {
            onSelect(null);
        }
    }

    return (
        <main
            ref={containerRef}
            className="relative flex-1 flex items-center justify-center bg-pink-100"
        >
            <div
                className="overflow-hidden rounded-lg border-4 border-pink-400"
                style={{ width: visualWidth, height: visualHeight }}
            >
                <div
                    className="relative"
                    style={{
                        width: canvasWidth,
                        height: canvasHeight,
                        transform: `scale(${fitScale})`,
                        transformOrigin: "0 0",
                        background: backgroundStyle,
                    }}
                >
                    <Stage
                        ref={stageRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseDown={handleStageMouseDown}
                        onTouchStart={
                            handleStageMouseDown as unknown as (
                                e: Konva.KonvaEventObject<TouchEvent>,
                            ) => void
                        }
                    >
                        <Layer>
                            {items.map((item) => {
                                const shared = {
                                    isSelected: item.id === selectedItemId,
                                    onSelect: () => onSelect(item.id),
                                    onDragEnd: (x: number, y: number) => {
                                        setDragPos(null);
                                        onDragEnd(item.id, x, y);
                                    },
                                    onDragMove: (x: number, y: number) => {
                                        if (item.id === selectedItemId) {
                                            setDragPos({ x, y });
                                        }
                                    },
                                    onTransformEnd: (
                                        x: number,
                                        y: number,
                                        scaleX: number,
                                        scaleY: number,
                                        rotation: number,
                                    ) => {
                                        onTransformEnd(item.id, x, y, scaleX, scaleY, rotation);
                                    },
                                };
                                return item.type === "text" ? (
                                    <CanvasText key={item.id} {...shared} item={item} />
                                ) : (
                                    <CanvasImage key={item.id} {...shared} item={item} />
                                );
                            })}
                        </Layer>
                    </Stage>
                    {selectedItemId && buttonPos && (
                        <div
                            style={{
                                position: "absolute",
                                zIndex: 10,
                                left: buttonPos.x,
                                top: Math.max(0, buttonPos.y - TOOLBAR_VERTICAL_OFFSET),
                                transform: "translate(0, -100%)",
                                pointerEvents: "auto",
                            }}
                            className="flex gap-1"
                        >
                            <ToolbarButton
                                label="Front"
                                onClick={() => onBringToFront(selectedItemId)}
                                icon={<BringToFrontIcon />}
                            />
                            <ToolbarButton
                                label="Back"
                                onClick={() => onSendToBack(selectedItemId)}
                                icon={<SendToBackIcon />}
                            />
                            <ToolbarButton
                                label="Delete"
                                onClick={() => onDelete(selectedItemId)}
                                icon={<DeleteIcon />}
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
