import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import type { CanvasItem } from "../App";
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
    item: CanvasItem;
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
}: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

    const selectedItem = selectedItemId
        ? (items.find((i) => i.id === selectedItemId) ?? null)
        : null;

    const buttonPos = selectedItem ? (dragPos ?? { x: selectedItem.x, y: selectedItem.y }) : null;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const newSize = {
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                };
                setSize(newSize);
                onResize(newSize);
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
            className="relative flex-1"
            style={{ background: backgroundStyle }}
        >
            {size.width > 0 && size.height > 0 && (
                <>
                    <Stage
                        width={size.width}
                        height={size.height}
                        onMouseDown={handleStageMouseDown}
                        onTouchStart={
                            handleStageMouseDown as unknown as (
                                e: Konva.KonvaEventObject<TouchEvent>,
                            ) => void
                        }
                    >
                        <Layer>
                            {items.map((item) => (
                                <CanvasImage
                                    key={item.id}
                                    item={item}
                                    isSelected={item.id === selectedItemId}
                                    onSelect={() => onSelect(item.id)}
                                    onDragEnd={(x, y) => {
                                        setDragPos(null);
                                        onDragEnd(item.id, x, y);
                                    }}
                                    onDragMove={(x, y) => {
                                        if (item.id === selectedItemId) {
                                            setDragPos({ x, y });
                                        }
                                    }}
                                    onTransformEnd={(x, y, scaleX, scaleY, rotation) => {
                                        onTransformEnd(item.id, x, y, scaleX, scaleY, rotation);
                                    }}
                                />
                            ))}
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
                </>
            )}
        </main>
    );
}
