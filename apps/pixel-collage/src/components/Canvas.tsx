import { useRef, useEffect, useLayoutEffect, useState } from "react";
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
    CANVAS_FIT_PADDING,
    CANVAS_ASPECT_RATIO,
    TEXT_FONT_FAMILY,
    TEXT_FONT_SIZE,
    TEXT_BOX_MIN_WIDTH,
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
    onCrop?: (id: string) => void;
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

const TOOLBAR_REFERENCE_CANVAS_WIDTH = 764;
const TOOLBAR_BUTTON_MAX_HEIGHT = 28;
const TOOLBAR_HORIZONTAL_MARGIN = 8;
const TOOLBAR_VERTICAL_MARGIN = 8;
const TOOLBAR_ITEM_CLEARANCE = 6;

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

function CropIcon() {
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
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M18 2v14a2 2 0 0 1-2 2H2" />
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
                id={item.id}
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
    const transformStartWidthRef = useRef<number | null>(null);

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
                id={item.id}
                text={item.text}
                fontFamily={TEXT_FONT_FAMILY}
                fontSize={TEXT_FONT_SIZE}
                fill={TEXT_FILL}
                width={item.width}
                wrap="word"
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
                onTransformStart={() => {
                    const node = textRef.current;
                    if (!node) return;
                    transformStartWidthRef.current = node.width();
                }}
                onTransform={() => {
                    const node = textRef.current;
                    if (!node) return;

                    const nextWidth = Math.max(
                        TEXT_BOX_MIN_WIDTH,
                        node.width() * Math.abs(node.scaleX()),
                    );
                    node.width(nextWidth);
                    node.scaleX(1);
                    node.scaleY(1);
                    node.getLayer()?.batchDraw();
                }}
                onTransformEnd={() => {
                    const node = textRef.current;
                    if (!node) return;
                    const startWidth = transformStartWidthRef.current ?? node.width();
                    const widthRatio = startWidth > 0 ? node.width() / startWidth : 1;
                    transformStartWidthRef.current = null;
                    onTransformEnd(node.x(), node.y(), widthRatio, 1, node.rotation());
                }}
            />
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    keepRatio={false}
                    enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                    flipEnabled={false}
                    boundBoxFunc={(_oldBox, newBox) => {
                        if (Math.abs(newBox.width) < TEXT_BOX_MIN_WIDTH) {
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
    onCrop,
    onDragEnd,
    onTransformEnd,
    onResize,
    backgroundStyle,
    stageRef,
}: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasSizeRef = useRef<{ width: number; height: number } | null>(null);
    const internalStageRef = useRef<Konva.Stage>(null);
    const toolbarContentRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
    const [toolbarBaseSize, setToolbarBaseSize] = useState({ width: 0, height: 0 });

    const selectedItem = selectedItemId
        ? (items.find((i) => i.id === selectedItemId) ?? null)
        : null;

    const buttonPos = selectedItem ? (dragPos ?? { x: selectedItem.x, y: selectedItem.y }) : null;
    const canCropSelectedImage = selectedItem?.type === "image" && Boolean(onCrop);
    const activeStageRef = stageRef ?? internalStageRef;
    const stageNode = activeStageRef.current;
    const selectedNode = selectedItemId
        ? stageNode?.findOne<Konva.Node>(`#${selectedItemId}`)
        : null;
    const selectedRect = selectedNode?.getClientRect({
        skipShadow: true,
        relativeTo: stageNode ?? undefined,
    });

    const canvasWidth = canvasSizeRef.current?.width ?? 0;
    const canvasHeight = canvasSizeRef.current?.height ?? 0;
    const toolbarButtonCount = selectedItemId ? (canCropSelectedImage ? 4 : 3) : 0;
    const maxToolbarWidth = Math.max(canvasWidth - TOOLBAR_HORIZONTAL_MARGIN * 2, 0);
    const measuredToolbarBaseWidth = toolbarBaseSize.width;
    const measuredToolbarBaseHeight = toolbarBaseSize.height;
    const fallbackToolbarBaseWidth = toolbarButtonCount > 0 ? maxToolbarWidth : 0;
    const toolbarBaseWidth =
        measuredToolbarBaseWidth > 0 ? measuredToolbarBaseWidth : fallbackToolbarBaseWidth;
    const toolbarBaseHeight =
        measuredToolbarBaseHeight > 0 ? measuredToolbarBaseHeight : TOOLBAR_BUTTON_MAX_HEIGHT;
    const canvasRelativeToolbarScale =
        canvasWidth > 0 ? Math.min(canvasWidth / TOOLBAR_REFERENCE_CANVAS_WIDTH, 1) : 1;
    const overflowToolbarScale =
        toolbarBaseWidth > 0 ? Math.min(maxToolbarWidth / toolbarBaseWidth, 1) : 1;
    const toolbarScale = Math.min(canvasRelativeToolbarScale, overflowToolbarScale, 1);
    const toolbarWidth = toolbarBaseWidth * toolbarScale;
    const toolbarHeight = toolbarBaseHeight * toolbarScale;
    const selectedCenterX = selectedRect
        ? selectedRect.x + selectedRect.width / 2
        : (buttonPos?.x ?? 0) + toolbarWidth / 2;
    const selectedTop = selectedRect ? selectedRect.y : (buttonPos?.y ?? 0);
    const selectedBottom = selectedRect
        ? selectedRect.y + selectedRect.height
        : (buttonPos?.y ?? 0);
    const toolbarX =
        selectedItemId && canvasWidth > 0
            ? Math.min(
                  Math.max(selectedCenterX - toolbarWidth / 2, TOOLBAR_HORIZONTAL_MARGIN),
                  Math.max(
                      TOOLBAR_HORIZONTAL_MARGIN,
                      canvasWidth - TOOLBAR_HORIZONTAL_MARGIN - toolbarWidth,
                  ),
              )
            : selectedCenterX - toolbarWidth / 2;
    const selectedMidY = (selectedTop + selectedBottom) / 2;
    const preferBelow = selectedMidY <= canvasHeight / 2;
    const preferredTop = preferBelow
        ? selectedBottom + TOOLBAR_ITEM_CLEARANCE
        : selectedTop - TOOLBAR_ITEM_CLEARANCE - toolbarHeight;
    const alternateTop = preferBelow
        ? selectedTop - TOOLBAR_ITEM_CLEARANCE - toolbarHeight
        : selectedBottom + TOOLBAR_ITEM_CLEARANCE;
    const maxToolbarTop = Math.max(
        TOOLBAR_VERTICAL_MARGIN,
        canvasHeight - TOOLBAR_VERTICAL_MARGIN - toolbarHeight,
    );
    const preferredFits = preferredTop >= TOOLBAR_VERTICAL_MARGIN && preferredTop <= maxToolbarTop;
    const alternateFits = alternateTop >= TOOLBAR_VERTICAL_MARGIN && alternateTop <= maxToolbarTop;
    const toolbarY =
        selectedItemId && canvasHeight > 0
            ? preferredFits
                ? preferredTop
                : alternateFits
                  ? alternateTop
                  : Math.min(Math.max(preferredTop, TOOLBAR_VERTICAL_MARGIN), maxToolbarTop)
            : preferredTop;

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

    useLayoutEffect(() => {
        const el = toolbarContentRef.current;
        if (!selectedItemId || !el) {
            setToolbarBaseSize({ width: 0, height: 0 });
            return;
        }

        const updateToolbarSize = () => {
            setToolbarBaseSize({
                width: el.offsetWidth,
                height: el.offsetHeight,
            });
        };

        updateToolbarSize();

        const observer = new ResizeObserver(updateToolbarSize);
        observer.observe(el);
        return () => observer.disconnect();
    }, [selectedItemId, canCropSelectedImage]);

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
                        ref={activeStageRef}
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
                                left: toolbarX,
                                top: toolbarY,
                                pointerEvents: "auto",
                            }}
                        >
                            <div
                                ref={toolbarContentRef}
                                className="flex gap-1"
                                style={{
                                    transform: `scale(${toolbarScale})`,
                                    transformOrigin: "left top",
                                }}
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
                                {canCropSelectedImage && (
                                    <ToolbarButton
                                        label="Crop"
                                        onClick={() => onCrop?.(selectedItemId)}
                                        icon={<CropIcon />}
                                    />
                                )}
                                <ToolbarButton
                                    label="Delete"
                                    onClick={() => onDelete(selectedItemId)}
                                    icon={<DeleteIcon />}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
