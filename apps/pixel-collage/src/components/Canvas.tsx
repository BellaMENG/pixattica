import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { CanvasItem } from "../App";
import type Konva from "konva";

interface CanvasProps {
    items: CanvasItem[];
    selectedItemId: string | null;
    onSelect: (id: string | null) => void;
    onDelete: (id: string) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
    backgroundStyle: string;
}

function CanvasImage({
    item,
    isSelected,
    onSelect,
    onDragEnd,
    onDragMove,
}: {
    item: CanvasItem;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
}) {
    const [image] = useImage(item.src);
    const imageRef = useRef<Konva.Image>(null);

    useEffect(() => {
        if (!imageRef.current) return;
        if (isSelected) {
            imageRef.current.shadowColor("deeppink");
            imageRef.current.shadowBlur(12);
            imageRef.current.shadowOpacity(0.8);
            imageRef.current.shadowOffset({ x: 0, y: 0 });
        } else {
            imageRef.current.shadowBlur(0);
            imageRef.current.shadowOpacity(0);
        }
        imageRef.current.getLayer()?.batchDraw();
    }, [isSelected]);

    return (
        <KonvaImage
            ref={imageRef}
            image={image}
            x={item.x}
            y={item.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                onDragEnd(e.target.x(), e.target.y());
            }}
            onDragMove={(e) => {
                onDragMove(e.target.x(), e.target.y());
            }}
        />
    );
}

export default function Canvas({
    items,
    selectedItemId,
    onSelect,
    onDelete,
    onDragEnd,
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
                setSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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
                                />
                            ))}
                        </Layer>
                    </Stage>
                    {selectedItemId && buttonPos && (
                        <button
                            onClick={() => onDelete(selectedItemId)}
                            style={{
                                position: "absolute",
                                zIndex: 10,
                                left: buttonPos.x,
                                top: Math.max(0, buttonPos.y - 8),
                                transform: "translate(0, -100%)",
                                pointerEvents: "auto",
                            }}
                            className="flex items-center gap-1 rounded-md bg-pink-500 px-2 py-1 text-xs font-medium text-white shadow-md transition-colors hover:bg-pink-600 cursor-pointer"
                        >
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
                            Delete
                        </button>
                    )}
                </>
            )}
        </main>
    );
}
